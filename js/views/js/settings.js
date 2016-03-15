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

	$('#unsubscribe').click(function(ev) {
		$.ajax({
			url: '/delete_subscription',
			type: 'post'
		})
		.done(function(rs) {
			console.log("success");
			alert(rs);
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		
	});
});