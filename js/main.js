let currentChart = null;
$(document).ready(function () {
  fetchData();
});
async function fetchData() {
  try {
    var customersResponse = await fetch("http://localhost:5000/customers");
    var customers = await customersResponse.json();

    var transactionsResponse = await fetch(
      "http://localhost:5000/transactions"
    );
    var transactions = await transactionsResponse.json();

    tableUi(customers, transactions);

    $("#nameFilter").on("input", function () {
      $("#amountFilter").val("");
      $(".chart-container").hide();
      filterName(customers, transactions, this.value);
    });

    $("#amountFilter").on("input", function () {
      $("#nameFilter").val("");
      $(".chart-container").hide();
      filterAmount(customers, transactions, this.value);
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}
function tableUi(customers, transactions) {
  let cartona = "";
  for (let i = 0; i < customers.length; i++) {
    let customer = customers[i];
    let customerTrans = transactions.filter((item) => {
      return item.customer_id == customer.id;
    });
    let dayAmount = {};
    for (let i = 0; i < customerTrans.length; i++) {
      let transactionDate = new Date(
        customerTrans[i].date
      ).toLocaleDateString();

      if (dayAmount[transactionDate]) {
        dayAmount[transactionDate] += customerTrans[i].amount;
      } else {
        dayAmount[transactionDate] = customerTrans[i].amount;
      }
    }
    let customerTransText = customerTrans
      .map((item) => {
        return `
        ${item.date}: $${item.amount}
        `;
      })
      .join("<br/>");

    cartona += `
    <tr>
            <td class="align-middle">${customer.name}</td>
            <td class="align-middle">
              ${customerTransText}
            </td>
            <td class="align-middle">
              <button class="graph btn btn-success" customer_id=${
                customer.id
              } dayAmount=${JSON.stringify(dayAmount)}>show</button>
            </td>
          </tr>
    `;
  }
  $("#transactionsTable tbody").html(cartona);
  $(".graph").click(function () {
    let customerId = $(this).attr("customer_id");
    let dayAmount = $(this).attr("dayAmount");

    // Clear existing chart
    if (currentChart) {
      currentChart.destroy(); // Destroy the existing chart
    }
    $(".chart-container").show();

    showTransactionChart(customerId, JSON.parse(dayAmount));
  });
}

function filterName(customers, transactions, val) {
  if (val == "") {
    tableUi(customers, transactions);
    return;
  }
  let filterCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(val)
  );
  tableUi(filterCustomers, transactions);
}

function removeDuplicates(arr) {
  return arr.filter((value, index) => arr.indexOf(value) === index);
}

function filterAmount(customers, transactions, val) {
  if (val === "") {
    return tableUi(customers, transactions);
  }
  let filteredTransactions = transactions.filter(
    (transaction) => transaction.amount == val
  );
  let filteredCustomerIds = removeDuplicates(
    filteredTransactions.map((transaction) => transaction.customer_id)
  );

  let filteredCustomers = customers.filter((customer) =>
    filteredCustomerIds.includes(Number(customer.id))
  );

  return tableUi(filteredCustomers, filteredTransactions);
}

function showTransactionChart(customerId, dayAmount) {
  let ctx = document.getElementById("myChart").getContext("2d");

  // Prepare chart data (labels and corresponding amounts)
  let chartLabels = Object.keys(dayAmount);
  let chartData = Object.values(dayAmount);

  currentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "Daily Transaction Amounts",
          data: chartData,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
