/**
 * JavaScript for the "Users" admin view.
 **/
$(function(){

	// User delete confirmation dialog
	var alerw = $('#alert_win');

	// Delete buttons
	$('.pdel').click(function(){
		console.log('?');
		var pid = $(this).attr('data-id');
		$('#del_confirm').attr('action', '/places/delete/'+pid+'/');
		alerw.modal();
	});
	
});