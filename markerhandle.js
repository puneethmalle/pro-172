var uid = null;
AFRAME.registerComponent("markerhandler", {
  init: async function() {
    var toys = await this.getToys();

    if (uid === null) {
      this.askUserId();
    }

    this.el.addEventListener("markerFound", () => {
      if (uid !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askUserId: function() {
    var iconUrl =
      "https://raw.githubusercontent.com/whitehatjr/ar-toy-store-assets/master/toy-shop.png";

    swal({
      title: "Welcome to Toy Shop!!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Type your uid Ex:( U01 )"
        }
      }
    }).then(inputValue => {
      uid = inputValue;
    });
  },
  handleMarkerFound: function(toys, markerId) {
    var toy = toys.filter(toy => toy.id === markerId)[0];

    if (toy.is_out_of_stock) {
      swal({
        icon: "warning",
        title: toy.toy_name.toUpperCase(),
        text: "This toy is out of stock!!!",
        timer: 2500,
        buttons: false
      });
    } else {

      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("position", toy.model_geometry.position);
      model.setAttribute("rotation", toy.model_geometry.rotation);
      model.setAttribute("scale", toy.model_geometry.scale);

      var model = document.querySelector(`#model-${toy.id}`);
      model.setAttribute("visible", true);

      var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
      mainPlane.setAttribute("visible", true);


      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");

      orderButtton.addEventListener("click", () => {
        uid = uid.toUpperCase();
        this.handleOrder(uid, toy);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "Thanks For Order !",
          text: "  ",
          timer: 2000,
          buttons: false
        });
      });

      orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

      payButton.addEventListener("click", () => this.handlePayment());
    }
  },
  handleOrder: function(uid, toy) {
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => {
        var details = doc.data();

        if (details["current_orders"][toy.id]) {
          details["current_orders"][toy.id]["quantity"] += 1;

          var currentQuantity = details["current_orders"][toy.id]["quantity"];

          details["current_orders"][toy.id]["subtotal"] =
            currentQuantity * toy.price;
        } else {
          details["current_orders"][toy.id] = {
            item: toy.toy_name,
            price: toy.price,
            quantity: 1,
            subtotal: toy.price * 1
          };
        }

        details.total_bill += toy.price;
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
  getToys: async function() {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  getorderSummary: async function(uid) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .get()
      .then(doc => doc.data());
  },
  handleOrderSummary: async function() {
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";
    uid = uid.toUpperCase();
    var orderSummary = await this.getorderSummary(uid);

    var tableBodyTag = document.getElementById("bill-table-body");
    tableBodyTag.innerHTML = "";

    var currentOrders = Object.keys(orderSummary.current_orders);
    currentOrders.map(i => {
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.current_orders[i].item;
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);
    });

    var totalTr = document.createElement("tr");

    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-cente");

    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";
    td3.appendChild(strongTag);

    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    tableBodyTag.appendChild(totalTr);
  },
  handlePayment: function() {
    document.getElementById("modal-div").style.display = "none";
    uid = uid.toUpperCase();
    firebase
      .firestore()
      .collection("users")
      .doc(uid)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "Thanks For Paying !",
          text: "We Hope You Like Your Toy !!",
          timer: 2500,
          buttons: false
        });
      });
  },
  handleMarkerLost: function() {
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});