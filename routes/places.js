'use strict';
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const Place   = require('../lib/models/Place');
const { ensureAuthenticated } = require('../middleware/auth');

const IMG_DIR = path.join(__dirname, '..', 'public', 'img', 'places');

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG and PNG images are allowed'));
  }
});

async function moveFile(src, dest) {
  try {
    await fs.promises.rename(src, dest);
  } catch {
    await fs.promises.copyFile(src, dest);
    await fs.promises.unlink(src);
  }
}

// IMPORTANT: /near and /within must be declared before /:id
// so Express doesn't match them as place IDs.

// GET /api/places/near?lat=X&lng=Y&maxDistance=5000
router.get('/near', ensureAuthenticated, async (req, res, next) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params are required' });

    const places = await Place.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('author', 'name').select('_id name description imgext location author created');

    res.json({ places });
  } catch (err) {
    next(err);
  }
});

// POST /api/places/within  body: { coordinates: [[[lng,lat], ...]] }
router.post('/within', ensureAuthenticated, async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates) return res.status(400).json({ error: 'coordinates are required' });

    const places = await Place.find({
      location: {
        $geoWithin: {
          $geometry: { type: 'Polygon', coordinates }
        }
      }
    }).populate('author', 'name').select('_id name description imgext location author created');

    res.json({ places });
  } catch (err) {
    next(err);
  }
});

// GET /api/places  — list with pagination + text search
router.get('/', ensureAuthenticated, async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1) - 1;
    const perPage = 10;
    const search  = req.query.search || '';
    const find    = {};
    if (search) {
      const re = new RegExp(search, 'i');
      find.$or = [{ name: re }, { description: re }];
    }
    const [places, total] = await Promise.all([
      Place.find(find)
        .populate('author', 'name')
        .select('_id name imgext description author edited created')
        .sort({ name: 1 })
        .limit(perPage)
        .skip(perPage * page),
      Place.countDocuments(find)
    ]);
    res.json({ places, page: page + 1, pages: Math.ceil(total / perPage), total });
  } catch (err) {
    next(err);
  }
});

// GET /api/places/:id
router.get('/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('author', 'name')
      .populate('last_edit_by', 'name');
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (err) {
    next(err);
  }
});

// POST /api/places  — create with optional image upload
router.post('/', ensureAuthenticated, upload.single('image'), async (req, res, next) => {
  const tempFile = req.file?.path;
  try {
    const { name, description, type, coordinates } = req.body;
    if (!name || !description || !coordinates) {
      if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
      return res.status(400).json({ error: 'name, description, and coordinates are required' });
    }

    let parsedCoords;
    try { parsedCoords = JSON.parse(coordinates); } catch {
      if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
      return res.status(400).json({ error: 'coordinates must be valid JSON' });
    }

    const ext = req.file ? path.extname(req.file.originalname).toLowerCase() : null;
    const now = new Date();
    const place = await Place.create({
      name, description,
      imgext: ext,
      location: { type: type || 'Point', coordinates: parsedCoords },
      author: req.user._id,
      last_edit_by: req.user._id,
      created: now, edited: now
    });

    if (req.file && ext) {
      await moveFile(tempFile, path.join(IMG_DIR, `${place._id}${ext}`));
    }

    res.status(201).json(place);
  } catch (err) {
    if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
    next(err);
  }
});

// PUT /api/places/:id  — update with optional image re-upload
router.put('/:id', ensureAuthenticated, upload.single('image'), async (req, res, next) => {
  const tempFile = req.file?.path;
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
      return res.status(404).json({ error: 'Place not found' });
    }

    const { name, description, type, coordinates } = req.body;
    if (name)        place.name = name;
    if (description) place.description = description;
    if (type)        place.location.type = type;
    if (coordinates) {
      try { place.location.coordinates = JSON.parse(coordinates); } catch {
        if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
        return res.status(400).json({ error: 'coordinates must be valid JSON' });
      }
    }

    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (place.imgext) {
        await fs.promises.unlink(path.join(IMG_DIR, `${place._id}${place.imgext}`)).catch(() => {});
      }
      await moveFile(tempFile, path.join(IMG_DIR, `${place._id}${ext}`));
      place.imgext = ext;
    }

    place.last_edit_by = req.user._id;
    place.edited = new Date();
    await place.save();
    res.json(place);
  } catch (err) {
    if (tempFile) await fs.promises.unlink(tempFile).catch(() => {});
    next(err);
  }
});

// DELETE /api/places/:id
router.delete('/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: 'Place not found' });

    if (place.imgext) {
      await fs.promises.unlink(path.join(IMG_DIR, `${place._id}${place.imgext}`)).catch(() => {});
    }
    await place.deleteOne();
    res.json({ message: `Place "${place.name}" deleted` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
