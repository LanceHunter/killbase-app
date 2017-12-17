(function() {
  console.log("You see me!");

  $('.delete').click(() => {
    let clickedButtonID = event.target.id;
    let assassin = event.target.id.slice(1);
    $(`#${clickedButtonID}`).replaceWith(`<button class="button outline secondary round small realDelete" id="d<%= assassin.id %>">Confirm Delete</button>`);
    $('.realDelete').click(() => {
      $.ajax({
        url: `/assassins/${assassin}`,
        method : 'DELETE',
        statusCode: {
            404: function() {
              window.alert('The page was not found');
            },
            500: function() {
              window.alert('There was a server error');
            }
          }
      })
      .fail(function(err) {
        window.alert('Something went wrong. Deletion not processed. Please try again later.');
      })
      .done(function(replytext) {
        window.location.reload();
      });
    });
  });


})();
