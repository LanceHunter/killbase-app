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
        window.location.assign(`/contracts/${contract}`);
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

  $('#addTheContract').click(() => {
    event.preventDefault();
    if ($('#targetName').val() && $('#secLevel').val() && $('#location').val() && $('#budget').val() && $('#photo_url').val() && $('#client').val()) {
      console.log('Inputs are valid.')
      $('#targetName').removeClass('error');
      $('#secLevel').removeClass('error');
      $('#location').removeClass('error');
      $('#budget').removeClass('error');
      $('#photo_url').removeClass('error');
      $('#client').removeClass('error');
      $(`#addTheContract`).replaceWith(`<button class="button round secondary outline large align-center" role="button" id="confirmAddContract">Confirm Add</button>`);
    } else { // If not all fields are filled out.
      console.log('Inputs are not valid.')
      if (!$('#targetName').val()) {
        $('#targetName').addClass('error');
      }
      if (!$('#secLevel').val()) {
        $('#secLevel').addClass('error');
      }
      if (!$('#location').val()) {
        $('#location').addClass('error');
      }
      if (!$('#budget').val()) {
        $('#budget').addClass('error');
      }
      if (!$('#photo_url').val()) {
        $('#photo_url').addClass('error');
      }
      if (!$('#client').val()) {
        $('#client').addClass('error');
      }
    }
  });

  $('.markComplete').click(() => {

  });

  // This is the code for editing contracts.

  let oldTargetName = $('#targetName').val();
  let newTargetName = '';
  let oldSecLevel = $('#secLevel').val();
  let newSecLevel = '';
  let oldTargetLocation = $('#location').val();
  let newTargetLocation = '';
  let oldBudget = $('#budget').val();
  let newBudget = '';
  let oldTargetPhoto = $('#photo_url').val();
  let newTargetPhoto = '';
  let oldClient = $('#client').val();
  let newClient = '';

  // The event listeners for input changing in all the fields.
  $('#targetName').on('input', () => {
    newTargetName = $('#targetName').val();
  });
  $('#secLevel').on('input', () => {
    newSecLevel = $('#secLevel').val();
  });
  $('#location').on('input', () => {
    newTargetLocation = $('#location').val();
  });
  $('#budget').on('input', () => {
    newBudget = $('#budget').val();
  });
  $('#photo_url').on('input', () => {
    newTargetPhoto = $('#photo_url').val();
  });
  $('#client').on('input', () => {
    newClient = $('#client').val();
  });

  $('#updateTheContract').click(() => {
    event.preventDefault();
    let updateData = {};
    let contractID = $('#updateTheContract').val()
    $(`#updateTheContract`).replaceWith(`<button class="button round secondary outline large align-center" role="button" id="confirmUpdateContract">Confirm Update</button>`);
    $('#confirmUpdateContract').click(() => {
      event.preventDefault();
      if (newTargetName && (newTargetName.trim() !== oldTargetName)) {
        updateData.targetName = newTargetName.trim();
      }
      if (newSecLevel && (newSecLevel !== oldSecLevel)) {
        updateData.secLevel = newSecLevel;
      }
      if (newTargetLocation && (newTargetLocation !== oldTargetLocation)) {
        updateData.location = newTargetLocation;
      }
      if (newBudget && (newBudget !== oldBudget)) {
        updateData.budget = newBudget;
      }
      if (newTargetPhoto && (newTargetPhoto !== oldTargetPhoto)) {
        updateData.photo_url = newTargetPhoto;
      }
      if (newClient && (newClient !== oldClient)) {
        updateData.client_name = newClient;
      }
      $.ajax({
        url: `/contracts/edit/${contractID}`,
        method : 'PATCH',
        statusCode: {
            404: function() {
              window.alert('The page was not found');
            },
            500: function() {
              window.alert('There was a server error');
            }
          },
        dataType : 'json',
        data : updateData
      })
      .fail(function(err) {
        window.alert('Something went wrong. Update not processed. Please try again later.');
      })
      .done(function(replytext) {
        window.location.assign(`/contracts/${contractID}`);
      });
    });
  });



})();
