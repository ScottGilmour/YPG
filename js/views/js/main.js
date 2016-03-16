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
					};
					//uniq_content = removeDuplicates(content);
					buildTable(content);
					field_count += rs.length;
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

	function setEventListeners() {
		$('.delete_row').click(function(ev) {
			if (ev.currentTarget) {
				$(this).parent().parent().detach();
			}
		});

		$('.save_row').click(function(ev) {

			var element = $(this);

			element.find('i').removeClass('save');
			element.parent().parent().dimmer('show');

			if (this.id) {
				var contentData = content[this.id];
			}

			$.ajax({
				url: '/add_contact',
				type: 'post',
				data: {
					contact : contentData
				}
			})
			.done(function(rs) {
				console.log(rs);
				console.log("success");
			})
			.fail(function() {
				console.log("error");
			})
			.always(function() {
				console.log("complete");
				element.parent().parent().dimmer('hide');
				element.find('i').addClass('check');
				element.off();
			});
			
			saveLeadToSF(contentData);
		});
	}

	function buildTable(rs) {
		for (var i = 0; i < rs.length; i++) {

			//Append new table row
			var html = '<tr id="result_row_' + i + '">';

			html += '<td>' + '<a class="save_row" id="'+i+'"> <i class="large save icon"></i> </a>  <a class="delete_row"><i class="large trash icon"></i></a> ' + '</td>';

			html += '<td>' + rs[i].title + '</td>';
			html += '<td>' + rs[i].addr + '</td>';
			html += '<td>' + rs[i].city + '</td>';
			html += '<td>' + rs[i].region + '</td>';
			html += '<td>' + rs[i].postal + '</td>';
			html += '<td>' + rs[i].phone + '</td>';
			html += '<td>' + rs[i].email + '</td>';
			
			html += '<td><a class="website_url" href="' + rs[i].website + '">' + rs[i].website + '</a></td>';

			html += '</tr>';

			//Append new table row
			$('#tbody').append(html);
			pullEmail(rs[i].website, i);
		}
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
			current_page = 0;

			fetchListings($('#searchinputwhat').val(), $('#searchinputwhere').val().replace(',', '+').replace(' ', ''), current_page);
		} 
	});

	function pullEmail(website_url, target) {

		$.ajax({
			url: '/crawl',
			type: 'get',
			data: {url: website_url},
		})
		.done(function(rs) {
			console.log(rs);
			console.log(target);
		})
		.fail(function() {
			console.log("error");
		})
		.always(function() {
			console.log("complete");
		});
		
	}

	function saveLeadToSF(lead) {
		//created at date - CreatedDate
        //NumberOfEmployees
        //AnnualRevenue
        //firstName + LastName
        //Industry
        //Lead Source
        //Title
        //Company
        //Website
        //Email
        //Phone
        //Street
        //City
        //State/Province
        //Postal
        //Country

        var new_lead = {
        	Title: lead.title,
        	Company: lead.title,
        	Website: lead.website,
        	Phone: lead.phone,
        	Street: lead.addr,
        	City: lead.city,
        	LeadSource: 'Web',
        	Country: 'Canada',
        	PostalCode: lead.postal,
        	State: lead.region,
        	LastName: lead.title
        };

        $.ajax({
			url: '/sf/create_lead',
			type: 'post',
			data: {
				lead: new_lead
			}
		})
		.done(function(rs) {
			alertify.logPosition("bottom right");
			alertify.success("Created new Salesforce lead");
		})
		.fail(function(rs) {
			alertify.error("Error adding Salesforce lead: " + rs);
		});
	}
});