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
			$('#unsubscribe').addClass('disabled');
			alertify.logPosition("bottom right");
			alertify.success("Cancelled subscription, sorry to see you go!");
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		
	});
});