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
            window.alert('The page was not found');
          },
          500: function() {
            window.alert('There was a server error');
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

  $('.delete').click(() => {
    let clickedButtonID = event.target.id;
    let contract = event.target.id.slice(1);
    $(`#${clickedButtonID}`).replaceWith(`<button class="button outline secondary round small realDelete" id="d<%= contract.contract_set_id %>">Confirm Delete</button>`);
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

  $('.deleteSolo').click(() => {
    let clickedButtonID = event.target.id;
    let contract = event.target.id.slice(1);
    $(`#${clickedButtonID}`).replaceWith(`<button class="button outline secondary round small realDelete" id="d<%= contract.contract_set_id %>">Confirm Delete</button>`);
    $('.realDelete').click(() => {
      $.ajax({
        url: `/contracts/${contract}`,
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
        window.location.assign('/contracts');
      });
    });
  });


})();
