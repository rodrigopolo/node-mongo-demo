/**
 * JavaScript for the "New user" admin view.
 **/
$(function(){

	if(!$('#email').val()){
		$('#timezone').val((new Date().getTimezoneOffset()/-60).toFixed(1));
	}
	
});