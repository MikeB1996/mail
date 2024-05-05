document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  //adding an event listener that on submit sends the mail
  document
    .querySelector("#compose-form")
    .addEventListener("submit", submitMail);
  // By default, load the inbox
  load_mailbox("inbox");
});

//function that runs on the submit of the send mail form
function submitMail(event) {
  //saving the content of the various boxes inside variables
  sendTo = document.querySelector("#compose-recipients").value;
  mailtitle = document.querySelector("#compose-subject").value;
  mailbody = document.querySelector("#compose-body").value;
  //sending the email
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      //submitting the mail to the backend
      recipients: sendTo,
      subject: mailtitle,
      body: mailbody,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      //redirect to the mailbox
      load_mailbox("inbox");
    });
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  //show the mails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // display the single email header for each email
      emails.forEach((element) => {
        showMailbox(element, mailbox);
      });
    });
}

function displayMail(id) {
  //clearing the screen from the list of mails to display the single mail
  document.querySelector("#emails-view").innerHTML = "";
  //getting the user's mail
  curuser = document.querySelector("#curuser").innerHTML;
  //fetching the email by the id that i passed to the function
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // displaying the email on the page
      const element = document.createElement("div");
      //populate the html of the div with the mail
      element.innerHTML = `<h5>From: ${email.sender}</h5>
      <h5>To: ${email.recipients}</h5>
      <h5>Title: ${email.subject}</h5>
      <h5>Time: ${email.timestamp}</h5>
      <button class="btn btn-sm btn-outline-primary" id="replybutton">Reply</button>
      <hr>
      <p>${email.body}</p>`;
      //add the div to the page (to the container div in this case)
      document.querySelector("#emails-view").append(element);
      //adding an event listener that listen on the reply button to reply to the mail
      document
        .querySelector("#replybutton")
        .addEventListener("click", function () {
          //calling the function to move to the compose mail view
          compose_email();
          //population the fields of reply mail with the data from the received mail
          document.querySelector(
            "#compose-recipients"
          ).value = `${email.sender}`;
          document.querySelector(
            "#compose-subject"
          ).value = `RE: ${email.subject}`;
          document.querySelector(
            "#compose-body"
          ).value = `"on ${email.timestamp} ${email.sender} wrote:\n${email.body}"\n`;
        });

      //adding archive button only for inbox mails and not for sent ones
      if (email.sender != curuser) {
        const Belement = document.createElement("button");
        if (email.archived) {
          Belement.innerHTML = "Unarchive";
        } else {
          Belement.innerHTML = "Archive";
        }
        //adding bootstrap class for formatting continuity with the other buttons
        Belement.setAttribute("class", "btn btn-sm btn-outline-primary");
        Belement.addEventListener("click", function () {
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              //invert the archived status of the mail based on the current state of it
              archived: !email.archived,
            }),
          }).then(() => {
            load_mailbox("inbox");
          });
        });
        document.querySelector("#emails-view").append(Belement);
      }
    });
}

function showMailbox(content, page) {
  //fatching the single mail
  fetch(`/emails/${content.id}`)
    .then((response) => response.json())
    .then((email) => {
      // creating the div for each email to insert the data and show the list of mails in the inbox
      const element = document.createElement("div");
      if (page == "sent") {
        element.innerHTML = `<h5>Title: ${email.subject}</h5>To: ${email.recipients} At: ${email.timestamp}`;
      } else {
        element.innerHTML = `<h5>Title: ${email.subject}</h5>From: ${email.sender} At: ${email.timestamp}`;
      }
      //adding the class for styling reasons
      element.setAttribute("class", "maillisting");
      //adding an event listener to the div so once clicked i can display the mail
      element.addEventListener("click", function () {
        //passing the id to the display mail function
        displayMail(email.id);
        //changing the read status to true
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      });
      //appending the div to the container in the page
      document.querySelector("#emails-view").append(element);
      //changing the css to show the mail is read or not (the default is not read white so in case it's read i change it to gray here)
      if (email.read == true) {
        element.style.backgroundColor = "gray";
      }
    });
}
