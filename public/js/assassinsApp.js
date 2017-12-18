(function() {
  console.log("You see me!");
  let codeNameFields = $('.codeNames');
  let codeNameFieldTotal = codeNameFields.length-1;


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
                  <input type="text" name="codeName" class="codeNames" id="anotherCodeName${codeNameFieldTotal}">
                        </div>`;
    $('#codeNameDiv').append(codeNameField);
  });

  //This is the code for adding an assassin.

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

// This is the code for editing assassins.

  let oldName = $('#editName').val();
  let newName = '';
  let oldAge = $('#editAge').val();
  let newAge = '';
  let oldCodeNames = $('.codeNames');
  let oldCodeNamesArr = [];
  for (let i=0; i<oldCodeNames.length; i++) {
    oldCodeNamesArr.push($(`#${oldCodeNames[i].id}`).val());
    console.log($(`#${oldCodeNames[i].id}`).val());
  }
  let oldPrice = $('#editPrice').val();
  let newPrice = '';
  let oldPhoto = $('#editPhoto_url').val();
  let newPhoto = '';
  let oldRating = $('#editRating').val();
  let newRating = '';
  let oldWeapon = $('#editWeapon').val();
  let newWeapon = '';
  let oldKills = $('#editKills').val();
  let newKills = '';
  let oldContact = $('#editContact').val();
  let newContact = '';

  // The event listeners for input changing in all the fields.
  $('#editName').on('input', () => {
    newName = $('#editName').val();
  });
  $('#editAge').on('input', () => {
    newAge = $('#editAge').val();
  });
  $('#editPrice').on('input', () => {
    newPrice = $('#editPrice').val();
  });
  $('#editPhoto_url').on('input', () => {
    newPhoto = $('#editPhoto_url').val();
  });
  $('#editRating').on('input', () => {
    newRating = $('#editRating').val();
  });
  $('#editWeapon').on('input', () => {
    newWeapon = $('#editWeapon').val();
  });
  $('#editKills').on('input', () => {
    newKills = $('#editKills').val();
  });
  $('#editContact').on('input', () => {
    newContact = $('#editContact').val();
  });

  $('#updateTheAssassin').click(() => {
    event.preventDefault();
    let updateData = {};
    let assassinID = $('#updateTheAssassin').val()
    $(`#updateTheAssassin`).replaceWith(`<button class="button round secondary outline large align-center" role="button" id="confirmUpdateAssassin">Confirm Update</button>`);
    $('#confirmUpdateAssassin').click(() => {
      event.preventDefault();
      let newCodeNames = $('.codeNames');
      console.log(newCodeNames.length);
      let newCodeNamesArr = [];
      for (let i=0; i<newCodeNames.length; i++) {
        if ($(`#${newCodeNames[i].id}`).val()) {
          newCodeNamesArr.push($(`#${newCodeNames[i].id}`).val());
          console.log($(`#${newCodeNames[i].id}`).val());
        }
      }
      updateData.codeNameArr = newCodeNamesArr;
      if (newName && (newName.trim() !== oldName)) {
        updateData.name = newName.trim();
      }
      if (newAge && (newAge !== oldAge)) {
        updateData.age = newAge;
      }
      if (newPrice && (newPrice !== oldPrice)) {
        updateData.price = newPrice;
      }
      if (newPhoto && (newPhoto !== oldPhoto)) {
        updateData.photo_url = newPhoto;
      }
      if (newRating && (newRating !== oldRating)) {
        updateData.rating = newRating;
      }
      if (newWeapon && (newWeapon !== oldWeapon)) {
        updateData.weapon = newWeapon;
      }
      if (newKills && (newKills !== oldKills)) {
        updateData.kills = newKills;
      }
      if (newContact && (newContact !== oldContact)) {
        updateData.contact_info = newContact;
      }
      $.ajax({
        url: `/assassins/edit/${assassinID}`,
        method : 'PATCH',
        statusCode: {
            200: function() {
              window.location.assign(`/assassins/${assassinID}`);
            },
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
        window.location.assign(`/assassins/${assassinID}`);
      });
    });

  })


})();
