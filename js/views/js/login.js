$(document).ready(function() {
	$('#submitbtn').click(function(rs) {
        $('#loginform').submit();
    });

    $('#passfield').keydown(function(event) {
    	if (event.which == 13) {
    		$('#loginform').submit();
    	}
    });
});