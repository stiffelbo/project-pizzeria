import { settings, select } from './settings.js'; //importowanie objektu
import Product from './components/Product.js'; //importowanie domyslne
import Cart from './components/Cart.js'; //importowanie domyslne

const app = {
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
            console.log('parsedResponse', parsedResponse);
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
        //console.log(cartElem);
        thisApp.cart = new Cart(cartElem);

        thisApp.productList = document.querySelector(select.containerOf.menu);
        thisApp.productList.addEventListener('add-to-cart', function(event) {
            console.log('Add-to-cart event: ', event.detail.product);
            thisApp.cart.add(event.detail.product.prepareCartProduct());
        });
    },

    //initialize app methods
    init: function() {
        const thisApp = this;
        /* 
                            console.log('*** App starting ***');
                            console.log('thisApp:', thisApp);
                            console.log('classNames:', classNames);
                            console.log('settings:', settings);
                            console.log('templates:', templates);
                            */
        thisApp.initData();
        thisApp.initCart();
    },
};

app.init();