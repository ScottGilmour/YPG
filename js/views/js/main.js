var outside_content = [];
var selected_content = [];
var phones = [];

$(document).ready(function() {
	var content = [];
	var field_count = 0;
	var current_page = 0;

	if(window.location.href.indexOf("https") > -1) {
       window.location.replace("http://104.196.23.57/scraper");
    }

	$('.ui.search.what')
	  .search({
	    apiSettings: {
	      url: 'https://www.yellowpages.ca/search/tools/ac/what/{query}'
	    },
	    fields: {
	      results : 'suggestedValues',
	      title   : 'alt'
	    },
	    minCharacters : 3,
	    onSelect: function(result, response) {
	    	$('.result.active').removeClass('active');
	    }
	});

	$('.ui.search.where')
	  .search({
	    apiSettings: {
	      url: 'https://www.yellowpages.ca/search/tools/ac/where/{query}'
	    },
	    fields: {
	      results : 'suggestedValues',
	      title   : 'alt'
	    },
	    minCharacters : 3,
	    onSelect: function(result, response) {
	    	$('.result.active').removeClass('active');
	    }
	});

	function fetchListings(query, loc, pg) {

		$.ajax({
				url: '/scrape',
				type: 'GET',
				dataType: 'json',
				data: {
					keyword: query,
					location: loc,
					page: pg
				},
				beforeSend: function(rs) {
					$('#loaderdiv').addClass('loading').addClass('disabled');
				}
			})
			.done(function(rs) {
				if (rs.length == 0) {
					console.log('No more results');
					setEventListeners();
					$('#loaderdiv').removeClass('loading').removeClass('disabled');
				} else {

					for (var i = 0; i < rs.length; i++) {
						content.push(rs[i]);
						outside_content.push(rs[i]);
					};
					content = removeDuplicates(content);
					buildTable(content);
					field_count += content.length;
					current_page = current_page + 1;
					$('#results').html(field_count);
					
					fetchListings(query, loc, current_page);
					
				};
			})
			.fail(function() {
				$('#divsearch').removeClass('loading').removeClass('disabled');
			})
			.always(function() {
				$('#divsearch').removeClass('loading').removeClass('disabled');
			});	
	}

	$('#saveBtn').click(function(ev) {
		saveAllSelected('sf', selected_content);
	});

	function saveAllSelected(target, contacts) {
		$('#saveBtn').addClass('disabled');
		if (target == 'sf') {

			var leads = [];

			for (var i = 0; i < contacts.length; i++) {
				var new_lead = {
		        	Title: contacts[i].title,
		        	Company: contacts[i].title,
		        	Website: contacts[i].website,
		        	Phone: contacts[i].phone,
		        	Street: contacts[i].addr,
		        	City: contacts[i].city,
		        	LeadSource: 'Web',
		        	Country: 'Canada',
		        	PostalCode: contacts[i].postal,
		        	State: contacts[i].region,
		        	LastName: contacts[i].title
		        };

		        leads.push(new_lead);
			};


			$.ajax({
				url: '/sf/create_lead',
				type: 'post',
				data: {
					lead: leads
				}
			})
			.done(function(rs) {
				alertify.logPosition("bottom right");
				alertify.success("Created new Salesforce lead");
				$('#saveBtn').removeClass('disabled');
			})
			.fail(function(rs) {
				alertify.error("Error adding Salesforce lead: " + rs);
			});
			
		}
	}

	function setEventListeners() {
		$('#selectAll').click(function(ev) {
			$('.result_list.checkbox').checkbox('check');
		});

		$('#selectNone').click(function(ev) {
			$('.result_list.checkbox').checkbox('uncheck');
		});

		$('#pullEmails').click(function(ev) {
			pullEmails();
		});

		$('.result_list.checkbox').checkbox({
			onChecked: function() {
				var id = $(this).prop('id');

				if (outside_content[id]) {
					selected_content.push(outside_content[id]);
				}

				if (selected_content.length > 0) { $('#saveBtn').removeClass('disabled'); }
			},
			onUnchecked: function() {
				var id = $(this).prop('id');
				if (outside_content[id]) {
					selected_content.pop(outside_content[id]);
				}

				if (selected_content.length == 0) { $('#saveBtn').addClass('disabled'); }
			}
		});
	}

	function buildTable(rs) {
		for (var i = 0; i < rs.length; i++) {

			//Append new table row
			var html = '<tr id="result_row_' + i + '">';

			html += '<td class="collapsing">' +
				        '<div class="ui fitted slider result_list checkbox">' +
				          '<input id="' + i + '" type="checkbox"> <label></label>' +
				        '</div>' +
				      '</td>';

			html += '<td>' + rs[i].title + '</td>';
			html += '<td>' + rs[i].addr + '</td>';
			html += '<td>' + rs[i].city + '</td>';
			html += '<td>' + rs[i].region + '</td>';
			html += '<td>' + rs[i].postal + '</td>';
			html += '<td>' + rs[i].phone + '</td>';
			
			html += '<td><a class="website_url" href="' + rs[i].website + '">' + rs[i].website + '</a></td>';

			html += '</tr>';

			//Append new table row
			$('#tbody').append(html);
		}
	}


	function removeDuplicates(content) {
		var new_content = [];

		for (var i = 0; i < content.length; i++) {
			if (content[i].phone.length > 7 && phones.indexOf(content[i].phone) == -1) {
				phones.push(content[i].phone);
				new_content.push(content[i]);
			}
		};

	    return new_content;
	}


	$('#searchBtn').click(function(ev) {
		if ($('#searchinputwhat').val() && $('#searchinputwhere').val() && $('.result.active').length == 0) {
			resetSearch();

			fetchListings($('#searchinputwhat').val(), $('#searchinputwhere').val().replace(',', '+').replace(' ', ''), current_page);
		} 
	});

	function resetSearch() {
		current_page = 0;
		field_count = 0;
		phones = [];
		$('#tbody').empty();
		$('#results').html(field_count);
		$('#pullEmails').off();
		$('.result_list.checkbox').off();
		$('#selectNone').off();
		$('#selectAll').off();
	}

	function pullEmails() {
		var website_urls = [];

		$('#pullEmails').addClass('disabled');

		if (selected_content.length > 0) {
			for (var i = 0; i < selected_content.length; i++) {
				if (selected_content[i].website.length > 10) {
					website_urls.push(selected_content[i].website);
				}
			};

			$.ajax({
				url: '/crawl',
				type: 'post',
				data: {urls: website_urls},
			})
			.done(function(rs) {
				console.log(rs);
				$('#pullEmails').removeClass('disabled');
				alertify.logPosition("bottom right");
				alertify.success("Added new emails to list");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
			});
		}
	}

	$('.menu .item').tab();
});