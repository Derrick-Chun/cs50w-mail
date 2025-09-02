console.log("inbox.js loaded at", new Date().toLocaleTimeString());

document.addEventListener('DOMContentLoaded', function () {
  console.log("DOM fully loaded, attaching event listeners");

  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));

  document.querySelector('#compose').addEventListener('click', () => {
    console.log("🖱️ Compose button clicked");
    compose_email();
  });

  const form = document.querySelector('#compose-form');
  if (form) {
    form.addEventListener('submit', send_email);
  }

  load_mailbox('inbox');
});

function show_view(view_id) {
  console.log("Switching view to:", view_id);
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector(view_id).style.display = 'block';
}

function compose_email(prefill) {
  console.log("✍️ compose_email called", prefill);
  show_view('#compose-view');

  const to = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');

  to.value = '';
  subject.value = '';
  body.value = '';

  if (prefill) {
    to.value = prefill.recipients || '';
    if (prefill.subject && prefill.subject.trim().toLowerCase().startsWith('re:')) {
      subject.value = prefill.subject;
    } else {
      subject.value = `Re: ${prefill.subject || ''}`;
    }
    const headerLine = `On ${prefill.timestamp} ${prefill.sender} wrote:\n`;
    body.value = `${headerLine}${prefill.body}\n\n`;
  }
}

function send_email(event) {
  event.preventDefault();
  console.log("📧 send_email triggered");

  const recipients = document.querySelector('#compose-recipients').value.trim();
  const subject = document.querySelector('#compose-subject').value.trim();
  const body = document.querySelector('#compose-body').value;

  console.log("Sending email to:", recipients, "subject:", subject);

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients, subject, body })
  })
    .then(response => response.json())
    .then(result => {
      console.log("Server response to send_email:", result);
      if (result.error) {
        alert(result.error);
        return;
      }
      load_mailbox('sent');
    })
    .catch(() => alert('Network error while sending email.'));
}

function load_mailbox(mailbox) {
  console.log("📬 Loading mailbox:", mailbox);
  show_view('#emails-view');

  const container = document.querySelector('#emails-view');
  container.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(`Loaded ${emails.length} emails from ${mailbox}`);
      emails.forEach(email => {
        const row = document.createElement('div');
        row.className = 'email-row';
        row.style.border = '1px solid #ddd';
        row.style.padding = '8px 10px';
        row.style.marginBottom = '6px';
        row.style.cursor = 'pointer';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.backgroundColor = email.read ? '#f0f0f0' : 'white';

        const left = document.createElement('div');
        left.innerHTML = `<strong>${mailbox === 'sent' ? 'To' : 'From'}:</strong> ${
          mailbox === 'sent' ? email.recipients.join(', ') : email.sender
        } &nbsp; | &nbsp; <span>${email.subject || '(no subject)'}</span>`;

        const right = document.createElement('div');
        right.textContent = email.timestamp;

        row.append(left, right);
        row.addEventListener('click', () => view_email(email.id, mailbox));
        container.append(row);
      });
    })
    .catch(() => {
      const err = document.createElement('div');
      err.textContent = 'Failed to load mailbox.';
      container.append(err);
    });
}

function view_email(email_id, currentMailbox) {
  console.log("Viewing email id:", email_id);
  show_view('#email-view');
  const view = document.querySelector('#email-view');
  view.innerHTML = '<p>Loading...</p>';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      console.log("Loaded email:", email);

      if (!email.read) {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true })
        });
      }

      view.innerHTML = '';

      const header = document.createElement('div');
      header.style.borderBottom = '1px solid #ddd';
      header.style.marginBottom = '8px';
      header.innerHTML = `
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Subject:</strong> ${email.subject || '(no subject)'}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
      `;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      actions.style.margin = '8px 0';

      const replyBtn = document.createElement('button');
      replyBtn.className = 'btn btn-sm btn-outline-primary';
      replyBtn.textContent = 'Reply';
      replyBtn.addEventListener('click', () => {
        console.log("↩️ Reply clicked for email id:", email.id);
        compose_email({
          recipients: email.sender,
          subject: email.subject || '',
          timestamp: email.timestamp,
          sender: email.sender,
          body: email.body
        });
      });
      actions.append(replyBtn);

      if (currentMailbox !== 'sent') {
        const archBtn = document.createElement('button');
        archBtn.className = 'btn btn-sm btn-outline-secondary';
        archBtn.textContent = email.archived ? 'Unarchive' : 'Archive';
        archBtn.addEventListener('click', () => {
          console.log("📦 Toggling archive for email id:", email.id);
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived })
          }).then(() => load_mailbox('inbox'));
        });
        actions.append(archBtn);
      }

      const body = document.createElement('div');
      body.style.whiteSpace = 'pre-wrap';
      body.style.marginTop = '8px';
      body.textContent = email.body;

      view.append(header, actions, body);
    })
    .catch(() => {
      view.innerHTML = '<p>Failed to load email.</p>';
    });
}
