import './style.css';
import { loadBlockedCompanies, parseCompanyList, saveBlockedCompanies } from '../shared/storage';

const form = document.querySelector<HTMLFormElement>('#company-form');
const textarea = document.querySelector<HTMLTextAreaElement>('#company-list');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (!form || !textarea || !status) {
  throw new Error('Popup UI failed to initialize.');
}

const formElement = form;
const textareaElement = textarea;
const statusElement = status;

function renderStatus(message: string): void {
  statusElement.textContent = message;
}

async function populateForm(): Promise<void> {
  const companies = await loadBlockedCompanies();
  textareaElement.value = companies.join('\n');
  renderStatus(
    companies.length > 0
      ? `${companies.length} blocked ${companies.length === 1 ? 'company' : 'companies'} saved.`
      : 'No blocked companies yet.',
  );
}

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();

  const companies = parseCompanyList(textareaElement.value);
  await saveBlockedCompanies(companies);
  textareaElement.value = companies.join('\n');

  renderStatus(
    companies.length > 0
      ? `Saved ${companies.length} ${companies.length === 1 ? 'company' : 'companies'}.`
      : 'Saved an empty list. Job cards will no longer be hidden.',
  );
});

void populateForm();
