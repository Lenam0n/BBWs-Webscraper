const { Client } = require("@notionhq/client");
const fs = require("fs");

require("dotenv").config();

// Initialize the Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// ID of the Notion database
const databaseId = process.env.NOTION_DATABASE_ID;

// Load the scraped data from the JSON file
const scrapedData = JSON.parse(fs.readFileSync("scrapedData.json", "utf8"));

// Function to ensure a Select option exists (for region)
async function ensureSelectOption(propertyName, optionValue) {
  const response = await notion.databases.retrieve({ database_id: databaseId });
  const selectProperty = response.properties[propertyName];

  // Check if the option already exists
  const optionExists = selectProperty.select.options.some(
    (option) => option.name === optionValue
  );

  // If the option doesn't exist, add it
  if (!optionExists) {
    const updateResponse = await notion.databases.update({
      database_id: databaseId,
      properties: {
        [propertyName]: {
          select: {
            options: [...selectProperty.select.options, { name: optionValue }],
          },
        },
      },
    });
    console.log(`Added new ${propertyName} option: ${optionValue}`);
  }
}

// Function to ensure Multi-select options exist (for specializations)
async function ensureMultiSelectOptions(propertyName, optionValues) {
  const response = await notion.databases.retrieve({ database_id: databaseId });
  const multiSelectProperty = response.properties[propertyName];

  const existingOptions = multiSelectProperty.multi_select.options.map(
    (option) => option.name
  );

  // Determine which options are missing
  const newOptions = optionValues.filter(
    (value) => !existingOptions.includes(value)
  );

  // If there are new options, add them
  if (newOptions.length > 0) {
    const updateResponse = await notion.databases.update({
      database_id: databaseId,
      properties: {
        [propertyName]: {
          multi_select: {
            options: [
              ...multiSelectProperty.multi_select.options,
              ...newOptions.map((value) => ({ name: value })),
            ],
          },
        },
      },
    });
    console.log(`Added new ${propertyName} options: ${newOptions.join(", ")}`);
  }
}

// Function to add data to the Notion database
async function addDataToNotion(item) {
  // Ensure that the region exists as a select option
  await ensureSelectOption("Region", item.address.region);

  // Ensure that specializations exist as multi-select options
  await ensureMultiSelectOptions("Specializations", item.specializations);

  // Create a new entry in the Notion database
  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Title: {
        title: [{ text: { content: item.title } }],
      },
      Website: {
        url: item.website,
      },
      Address: {
        rich_text: [
          {
            text: {
              content: `${item.address.street}, ${item.address.city}`,
            },
          },
        ],
      },
      Carrier: {
        rich_text: [{ text: { content: item.carrier } }],
      },
      Region: {
        select: { name: item.address.region },
      },
      Specializations: {
        multi_select: item.specializations.map((spec) => ({ name: spec })),
      },
      Contacts: {
        rich_text: [
          {
            text: {
              content: item.contacts
                .map(
                  (contact) =>
                    `${contact.name} - ${contact.phone} - ${contact.email}`
                )
                .join("\n"),
            },
          },
        ],
      },
    },
  });

  console.log(`Added new entry to Notion: ${item.title}`);
}

// Function to process all items from scraped data
async function processScrapedData() {
  for (const item of scrapedData) {
    await addDataToNotion(item);
  }
  console.log("All data added to Notion.");
}

// Start the process
processScrapedData();
