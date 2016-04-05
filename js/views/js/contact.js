$(document).ready(function() {
	var content = [];

	loadEmailList();

	function loadEmailList() {
		$.ajax({
			url: '/get_emails',
			type: 'get',
			dataType: 'json'
		})
		.done(function(rs) {
			console.log("success");
			buildEmailTable(rs);
		})
		.fail(function(rs) {
			console.log("error " + rs);
		})
		.always(function() {
			console.log("complete");
		});
	}

	$.ajax({
		url: '/fetch_contacts',
		type: 'get',
		dataType: 'json'
	})
	.done(function(rs) {
		for (var i = 0; i < rs.length; i++) {
			content.push(rs[i]);
		};

		buildTable(rs);
	})
	.fail(function() {
		console.log("error");
	})
	.always(function() {
		console.log("complete");
	});

	function buildEmailTable(rs) {
		for (var i = 0; i < rs.length; i++) {

			//Append new table row
			var html = '<tr id="' + i + '">';

			html += '<td>' + rs[i].phone + '</td>';

			html += '</tr>';

			//Append new table row
			$('#email_tbody').append(html);
		}
		setEventListeners();
	}

	function buildTable(rs) {
		for (var i = 0; i < rs.length; i++) {

			//Append new table row
			var html = '<tr id="' + i + '">';

			html += '<td>' + '<a class="delete_row"><i class="large trash icon"></i></a>' + '</td>'

			html += '<td>' + rs[i].title + '</td>';
			html += '<td>' + rs[i].address + '</td>';
			html += '<td>' + rs[i].city + '</td>';
			html += '<td>' + rs[i].region + '</td>';
			html += '<td>' + rs[i].postal + '</td>';
			html += '<td>' + rs[i].phone + '</td>';
			
			html += '<td><a href="' + rs[i].website + '">' + rs[i].website + '</a></td>';

			html += '</tr>';

			//Append new table row
			$('#contact_tbody').append(html);
		}
		setEventListeners();
	}

	function setEventListeners() {
		$('.delete_row').click(function(ev) {
			if (ev.currentTarget) {
				var id = $(this).parent().parent().attr('id');
				var contact_to_delete = content[id]._id;

				$.ajax({
					url: '/delete_contact',
					type: 'post',
					data: {
						id: contact_to_delete
					},
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
				

				$(this).parent().parent().detach();
			}
		});
	}
	

});