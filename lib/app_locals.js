/**
 *
 * App locals for use on views, 100% developed by RodrigoPolo.com - MIT license.
 * This app locals act as view's helpers.
 *
 **/

var moment = require('moment');
module.exports = function(app){

	// scapes html reserved chars
	app.locals.htmlEsc = function(html) {
		return String(html)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}


	// navbar active helper
	app.locals.navbar_up = function(op){

		//console.log('Role: '+op.user.role);

		var r = '';
		for(k in op.links){	
			op.links[k].active = (op.links[k].url==op.path)?op.active:'';

			if(op.links[k].per){
				if(op.user){
					if(op.user.role <= op.links[k].per){
						r += op.template.replace(/{[^{}]+}/g, function(key){
							return op.links[k][key.replace(/[{}]+/g, "")] || "";
						});
					}
				}
			}else{
				r += op.template.replace(/{[^{}]+}/g, function(key){
					return op.links[k][key.replace(/[{}]+/g, "")] || "";
				});
			}

		}
		return r;
	}

	// HTML <select> helper
	app.locals.select = function(op){
		var selected = op.selected || '';
		var sel_txt='';
		var r='<select';
		r+= (op.id)?' id="'+op.id+'"':'';
		r+= (op.name)?' name="'+op.name+'"':'';
		r+= (op.class)?' class="'+op.class+'"':'';
		r+= ">\n";
		for(k in op.options){
			sel_txt = (op.options[k].value == selected)?' selected="selected"':'';
			r+= '<option'+sel_txt+' value="'+app.locals.htmlEsc(op.options[k].value)+'">'+op.options[k].text+"</option>\n";
		}
		r+= '</select>';
		return r;
	}

	// HTML <input> helper
	app.locals.input = function(op){
		var placeholder = true;
		var r = '<input';
		r+= (op.id)?' id="'+op.id+'"':'';
		r+= (op.name)?' name="'+op.name+'"':'';
		r+= (op.type)?' type="'+op.type+'"':'';
		r+= (op.class)?' class="'+op.class+'"':'';
		if(op.value){
			if(op.value.length>0){
				r+= ' value="'+app.locals.htmlEsc(op.value)+'"';
				placeholder = false;
			}
		}
		if(placeholder){
			r+= (op.placeholder)?' placeholder="'+op.placeholder+'"':'';
		}
		r+= (op.required)?' required':'';
		r+= (op.autofocus)?' autofocus':'';
		r+= ">\n";
		return r;
	}

	// Bootstrap paginator
	app.locals.BootstrapPaginator = function(op){
		if(op.pages>1){
			var max_pages = op.max_pages-1,
			    max_up = op.pages - max_pages,
			    from = Math.floor(op.page-(max_pages/2));
			from = (from<1)?1:from;
			from = (from>max_up && max_pages<op.pages)?max_up:from;
			var to = from + max_pages;
			to = (to>=op.pages)?op.pages:to;
			var prev = op.page - 1,
			    next = op.page + 1;
			prev = (prev<1)?1:prev;
			next = (next>op.pages)?op.pages:next;
			var active = '';
			var r ='<ul class="pagination">\n';
			r += '<li><a href="'+op.route+'1/">&laquo;</a></li>';
			r += '<li><a href="'+op.route+prev+'/">&lsaquo;</a></li>';
			for(var i=from; i <= to; i++){
				active = (i==op.page)?' class="active"':'';
				r += '<li'+active+'><a href="'+op.route+i+'/">'+i+'</a></li>';
			}
			r += '<li><a href="'+op.route+next+'/">&rsaquo;</a></li>';
			r += '<li><a href="'+op.route+op.pages+'/">&raquo;</a></li>';
			return r;
		}else{
			return '';
		}
	}

	// Moment.js helper for time management and format
	app.locals.moment = moment;

	// Convert a JS timestamp to a user timestamp
	app.locals.localTime = function(timestamp, timezone, format) {
		return moment.utc(timestamp).add(timezone, 'h').format(format);
	}

};
