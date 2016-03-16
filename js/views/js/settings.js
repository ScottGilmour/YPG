$(document).ready(function() {
	$('#localeDropdown').dropdown();

	$('.menu .item').tab();

	$('#unsubscribe').click(function(ev) {
		$.ajax({
			url: '/delete_subscription',
			type: 'post'
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
});