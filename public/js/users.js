console.log(':P');



$(function(){

	// User delete confirmation dialog
	var alerw = $('#alert_win');

	// Delete buttons
	$('.udel').click(function(){
		var $this = $(this);
		var uid = $this.attr('data-id');
		$('#del_confirm').attr('action', '/users/delete/'+uid+'/');
		alerw.modal();
	});
	
});