$(document).ready(function () {
  $('.delete-article').on('click', function (e) {
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type: 'DELETE',
      url: '/articles/' + id,
      success: function (response) {
        window.location.href = '/';
      },
      error: function (err) {
        console.log(err);
      }
    });
  });
});

function showImage(){
  if(this.files && this.files[0]){
    var obj = new FileReader();
    obj.onload = function(data){
      var image = document.getElementById('profilePreview');
      image.src = data.target.result;
      image.style.display = "block";
    }
    obj.readAsDataURL(this.files[0]);
  }
}