import { settings, select, classNames } from './settings.js'; //importowanie objektu
import Product from './components/Product.js'; //importowanie domyslne
import Cart from './components/Cart.js'; //importowanie domyslne
import Booking from './components/Booking.js'; //importowanie domyslne
import Home from './components/Home.js'; //importowanie domyslne

const app = {
    initPages: function() {
        const thisApp = this;

        thisApp.pages = document.querySelector(select.containerOf.pages).children;

        thisApp.navLinks = document.querySelectorAll(select.nav.links);

        const idFromHash = window.location.hash.replace('#/', '');

        let pageMatchingHash = thisApp.pages[0].id;
        for (let page of thisApp.pages) {
            if (page.id == idFromHash) {
                pageMatchingHash = page.id;
                break;
            }
        }

        thisApp.activatePage(pageMatchingHash);

        for (let link of thisApp.navLinks) {
            link.addEventListener('click', function(event) {
                const clickedElement = this;
                event.preventDefault();
                /* get page id from href */
                const id = clickedElement.getAttribute('href').replace('#', '');
                /* run thisApp.activatePage with that id */
                thisApp.activatePage(id);
                /*change URL hash */
                window.location.hash = '#/' + id;
            });
        }
    },

    activatePage: function(pageId) {
        const thisApp = this;
        /* add class "active" to matching pages, remove from non matching */
        for (let page of thisApp.pages) {
            page.classList.toggle(classNames.pages.active, page.id == pageId);
        }

        /* add class "active" to matching links, remove from non matching */
        for (let link of thisApp.navLinks) {
            link.classList.toggle(
                classNames.nav.active,
                link.getAttribute('href') == '#' + pageId
            );
        }

        /*if Home page add event listeners to tile links */
        if (pageId == 'home') {
            thisApp.navTileLinks = document.querySelectorAll(select.nav.tileLinks);
            console.log('tile links: ', thisApp.navTileLinks);
        }


    },

    //iterate thru all products in data.products, instantiate Product for evry
    initMenu: function() {
        const thisApp = this;
        //console.log('thisApp.data:', thisApp.data);

        for (let productData in thisApp.data.products) {
            new Product(productData, thisApp.data.products[productData]);
        }
    },

    //colectd initial product data from object dataSource
    initData: function() {
        const thisApp = this;
        const url = settings.db.url + '/' + settings.db.product;
        thisApp.data = {};

        fetch(url).then(function(rawResponse) {
            return rawResponse.json();
        }).then(function(parsedResponse) {
            /* save parsedResponse as thisApp.data.products */
            thisApp.data.products = parsedResponse;
            /*Execute initMenu method */
            thisApp.initMenu();
        });
    },

    //instantiate Cart
    initCart: function() {
        const thisApp = this;

        const cartElem = document.querySelector(select.containerOf.cart);
        thisApp.cart = new Cart(cartElem);
        thisApp.productList = document.querySelector(select.containerOf.menu);
        thisApp.productList.addEventListener('add-to-cart', function(event) {
            thisApp.cart.add(event.detail.product.prepareCartProduct());
        });
    },

    initBooking: function() {
        const thisApp = this;

        const bookingContainer = document.querySelector(select.containerOf.booking);
        thisApp.booking = new Booking(bookingContainer);
    },

    initHome: function() {
        const thisApp = this;

        const homeContainer = document.querySelector(select.containerOf.home);
        thisApp.home = new Home(homeContainer);
        thisApp.navTileLinks = homeContainer.querySelectorAll(select.nav.tileLinks);
        for (let link of thisApp.navTileLinks) {
            link.addEventListener('click', function(event) {
                const clickedElement = this;
                console.log('clicked tile link: ', clickedElement);
                event.preventDefault();
                /* get page id from href */
                const id = clickedElement.getAttribute('href').replace('#', '');
                console.log('tileLinks: ', id);
                /* run thisApp.activatePage with that id */
                thisApp.activatePage(id);
                /*change URL hash */
                window.location.hash = '#/' + id;
            });
        }
    },

    //initialize app methods
    init: function() {
        const thisApp = this;
        thisApp.initPages();
        thisApp.initHome();
        thisApp.initData();
        thisApp.initCart();
        thisApp.initBooking();
    },
};

app.init();