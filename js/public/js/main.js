$(document).ready(function() {
	var content = [];
	var field_count = 0;
	var current_page = 0;

	$('#submitbtn').click(function(rs) {
		$('#loginform').submit();
	});

	$('.ui.search.what')
	  .search({
	    apiSettings: {
	      url: 'http://www.yellowpages.ca/search/tools/ac/what/{query}'
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
	      url: 'http://www.yellowpages.ca/search/tools/ac/where/{query}'
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
					$('#divsearch').addClass('loading').addClass('disabled');
				}
			})
			.done(function(rs) {
				if (rs.hasOwnProperty('error')) {
					console.log('No more results');
				} else {
					content.push(rs.listings);
					uniq_content = removeDuplicates(content);
					buildTable(uniq_content);
					field_count += rs.listings.length;
					current_page = current_page + 1;
					$('#results').html(field_count);
					if (current_page < 10) {
						fetchListings(query, loc, current_page);
					} else {
						console.log('Max pages reached');
					}
				};
			})
			.fail(function() {
				$('#divsearch').removeClass('loading').removeClass('disabled');
			})
			.always(function() {
				$('#divsearch').removeClass('loading').removeClass('disabled');
			});	
	}

	function buildTable(rs) {
		for (var x = 0; x < rs.length; x++) {
			for (var i = 0; i < rs[x].length; i++) {

				//Append new table row
				var html = '<tr>';

				html += '<td>' + rs[x][i].addr + '</td>';
				html += '<td>' + rs[x][i].city + '</td>';
				html += '<td>' + rs[x][i].phone + '</td>';
				html += '<td>' + rs[x][i].postal + '</td>';
				html += '<td>' + rs[x][i].region + '</td>';
				html += '<td>' + rs[x][i].title + '</td>';
				html += '<td><a href="' + rs[x][i].website + '">' + rs[x][i].website + '</a></td>';

				html += '</tr>';

				//Append new table row
				$('#tbody').append(html);
			}
		};
	}


	function removeDuplicates(content) {

		var comparer = function compareObject(a, b) {
	        if (a.title == b.title) {
	        	if (a.phone == b.phone) {
	        		return 0;
	        	} else if (a.title > b.title) {
	        		return 1;
	        	} else {
	        		return -1;
	        	}
	        } else {
	            if (a.title < b.title) {
	                return -1;
	            } else {
	                return 1;
	            }
	        }
		}

		content.sort(comparer);

		for (var i = 0; i < content.length - 1; ++i) {
	        if (comparer(content[i], content[i+1]) === 0) {
	            content.splice(i, 1);
	        }
	    }

	    return content;
	}


	$('#searchBtn').click(function(ev) {
		if ($('#searchinputwhat').val() && $('#searchinputwhere').val() && $('.result.active').length == 0) {
			$('#tbody').empty();

			fetchListings($('#searchinputwhat').val(), $('#searchinputwhere').val().replace(',', '+').replace(' ', ''), current_page);

		} 
	});

});