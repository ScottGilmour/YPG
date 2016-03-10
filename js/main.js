$(document).ready(function() {
	console.log('leggo');

	var content = [];

	$('#searchinput').on('input', function(event) {
		if ($(this).val().length < 3) 
			return;

		$.ajax({
			url: 'http://www.yellowpages.ca/search/tools/ac/what/' + $(this).val(),
			type: 'GET',
			dataType: 'json'
		})
		.done(function(rs) {
			content = [];
			for (var i = rs.suggestedValues.length - 1; i >= 0; i--) {
				content.push({title: rs.suggestedValues[i].alt});
			};

			$('.ui.search').search({
				source: content
			});
		})
		.fail(function(rs) {
			console.log("error");
		})
		.always(function(rs) {
			console.log("complete");
		});
			
	}).keydown(function(ev) {
		if (ev.which == 13) {

			$.ajax({
				url: '/scrape',
				type: 'GET',
				dataType: 'json',
				data: {
					keyword: $(this).val(),
					location: 'Burlington+ON'
				},
			})
			.done(function(rs) {
				console.log("success" + rs);
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
			
		}
	});
});