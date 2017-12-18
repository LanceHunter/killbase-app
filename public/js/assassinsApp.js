(function() {
  console.log("You see me!");
  let codeNameFieldTotal = 1;

  

  $('.delete').click(() => {
    let clickedButtonID = event.target.id;
    let newIDNumber = event.target.id.slice(1);
    $(`#${clickedButtonID}`).replaceWith(`<button class="button outline secondary round small realDelete" id="d${newIDNumber}">Confirm Delete</button>`);
    $('.realDelete').click(() => {
      let assassin = event.target.id.slice(1);
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
    let newIDNumber = event.target.id.slice(1);
    $(`#${clickedButtonID}`).replaceWith(`<button class="button outline secondary round small realDelete" id="d${newIDNumber}">Confirm Delete</button>`);
    $('.realDelete').click(() => {
      let assassin = event.target.id.slice(1);
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
        window.location.assign('/assassins');
      });
    });
  });

  $('#addCodeName').click(() => {
    event.preventDefault();
    codeNameFieldTotal++;
    let codeNameField = `<div class="w90" id="codeNameLines">
                  <input type="text" name="codeName">
                        </div>`;
    $('#codeNameDiv').append(codeNameField);
  });

  $('#addTheAssassin').click(() => {
    event.preventDefault();
    let emailReg = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
    if ($('#name').val() && $('#age').val() && $('#price').val() && $('#rating').val() && $('#weapon').val() && $('#kills').val() && $('#contact').val()) {
      console.log('Inputs are valid.')
      $('#name').removeClass('error');
      $('#age').removeClass('error');
      $('#price').removeClass('error');
      $('#rating').removeClass('error');
      $('#weapon').removeClass('error');
      $('#kills').removeClass('error');
      $('#contact').removeClass('error');
      $(`#addTheAssassin`).replaceWith(`<button class="button round secondary outline large align-center" role="button" id="confirmAddAssassin">Confirm Add</button>`);
    } else { // If not all fields are filled out.
      console.log('Inputs are not valid.')
      if (!$('#name').val()) {
        $('#name').addClass('error');
      }
      if (!$('#age').val()) {
        $('#age').addClass('error');
      }
      if (!$('#price').val()) {
        $('#price').addClass('error');
      }
      if (!$('#rating').val()) {
        $('#rating').addClass('error');
      }
      if (!$('#weapon').val()) {
        $('#weapon').addClass('error');
      }
      if (!$('#kills').val()) {
        $('#kills').addClass('error');
      }
      if (!$('#contact').val()) {
        $('#contact').addClass('error');
      }
    }

  });


})();
