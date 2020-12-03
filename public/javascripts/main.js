let el = document.querySelector('.coutry__sidebar');
let countrysEl = document.querySelector('.countrys');
let loader = document.querySelector('.loader');

if (el) {
    el.addEventListener('change', (ev) => {
        countrysEl.style.display = "none";
        loader.style.display = "block";
        document.location.replace(`/${ev.target.value}`);
    });
};  


