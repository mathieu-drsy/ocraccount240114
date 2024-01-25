var Page = function(){};

Page.prototype.InitPage = function(){
	this.LoadData();	
};

Page.prototype.LoadData = function(){
	$.ajax({
		url: "/getUsers"
	}).done(function(data) {
		reactPage.DrawTable(data);
	});
};

var page = new Page();

$(document).ready(function(){
	page.InitPage();
});

function loginUser() {
    const username = $('#username').val();

    // Check if username is provided
    if (username) {
        // Store username in local storage
        localStorage.setItem('username', username);

        // Close the modal
        $('#loginModal').modal('hide');

        // You can perform additional actions upon successful login
        // For example, reload the page to reflect the login state
        location.reload();
    } else {
        alert('Please enter a username.');
    }
}

// Bind click event to the login button
$(document).ready(function() {
    $('#loginButton').on('click', function() {
        loginUser();
    });
});
