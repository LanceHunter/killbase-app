(function() {

  $('.removeButton').click(() => {
    let targetID = event.target.id;
    $.ajax({
      url: '/contracts/assign',
      method : 'DELETE',
      statusCode: {
          404: function() {
            alert('The page was not found');
          },
          500: function() {
            alert('There was a server error');
          }
        },
      data: {
        'assassinID' : event.target.id,
        'contractID' : event.target.value
        }
    })
    .done(function(replytext) {
      console.log(replytext);
      $(`#${targetID}`).parent().parent().remove();
    });

  });

})();
