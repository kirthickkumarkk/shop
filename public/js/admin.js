const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=id]').value;
    const csrfToken = btn.parentNode.querySelector('[name=_csrf]').value;
    
    const prodArticle = btn.closest('article');

    fetch('/admin/product/' + prodId, {
        method: "DELETE",
        headers: {'csrf-token': csrfToken}
    })
        .then(result => console.log(result))
        .catch(err => console.log(err));

    // remove() works for modern browsers 
    prodArticle.parentNode.removeChild(prodArticle);
    // btn.parentNode.parentNode.remove();
};