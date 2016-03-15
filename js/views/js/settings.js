$(document).ready(function() {
	$('#salesforceAuth').click(function(ev) {

		$.ajax({
			url: '/oauth2/auth',
			type: 'get'
		})
		.done(function() {
			console.log("success");
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		

	});

	$('#localeDropdown').dropdown();

	$('.menu .item').tab();
});