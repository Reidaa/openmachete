import './style.css';
import {
  loadBlockedCompanies,
  loadFilterEnabled,
  parseCompanyList,
  saveBlockedCompanies,
  saveFilterEnabled,
} from '../shared/storage';

const form = document.querySelector<HTMLFormElement>('#company-form');
const textarea = document.querySelector<HTMLTextAreaElement>('#company-list');
const enabledInput = document.querySelector<HTMLInputElement>('#filter-enabled');
const status = document.querySelector<HTMLParagraphElement>('#status');

if (!form || !textarea || !enabledInput || !status) {
  throw new Error('Popup UI failed to initialize.');
}

const formElement = form;
const textareaElement = textarea;
const enabledInputElement = enabledInput;
const statusElement = status;

let blockedCompanies: string[] = [];
let filterEnabled = true;

function renderStatus(message?: string): void {
  if (message) {
    statusElement.textContent = message;
    return;
  }

  if (!filterEnabled) {
    statusElement.textContent = 'Filtering is off. Your blocked companies are still saved.';
    return;
  }

  statusElement.textContent =
    blockedCompanies.length > 0
      ? `${blockedCompanies.length} blocked ${
          blockedCompanies.length === 1 ? 'company' : 'companies'
        } saved.`
      : 'No blocked companies yet.';
}

async function populateForm(): Promise<void> {
  const [companies, enabled] = await Promise.all([loadBlockedCompanies(), loadFilterEnabled()]);

  blockedCompanies = companies;
  filterEnabled = enabled;
  textareaElement.value = blockedCompanies.join('\n');
  enabledInputElement.checked = filterEnabled;
  renderStatus();
}

formElement.addEventListener('submit', async (event) => {
  event.preventDefault();

  const companies = parseCompanyList(textareaElement.value);
  blockedCompanies = companies;
  await saveBlockedCompanies(companies);
  textareaElement.value = blockedCompanies.join('\n');

  renderStatus(
    blockedCompanies.length > 0
      ? `Saved ${blockedCompanies.length} ${
          blockedCompanies.length === 1 ? 'company' : 'companies'
        }.`
      : 'Saved an empty list. Job cards will no longer be hidden.',
  );
});

enabledInputElement.addEventListener('change', async () => {
  filterEnabled = enabledInputElement.checked;
  await saveFilterEnabled(filterEnabled);

  renderStatus(filterEnabled ? 'Filtering turned on.' : 'Filtering turned off.');
});

void populateForm();
