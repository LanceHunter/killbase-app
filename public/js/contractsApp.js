(function() {

  $('#assignAssassin').click(() => {
    let assassin = $('#assassinToAssign').val();
    let contract = $('#assignAssassin').val();
    console.log(assassin);
    $.post(`/contracts/assign`, {
        'assassinToAssign' : assassin,
        'contractAssigned' : contract
      },
      function(data) {
        window.location.reload();
      }
    )
    .fail(function(err) {
      window.alert('Something went wrong. Assignment not processed. Please try again later.');
    });
    event.preventDefault();
  });

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
