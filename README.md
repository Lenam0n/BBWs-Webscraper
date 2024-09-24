# Notion Database Schema for Scraped Data

This document outlines the schema and property types required for setting up a Notion database to store the scraped data.

## Property Setup in Notion

Below is a table that defines the columns (properties) and their respective types in the Notion database:

| Column (Property) Name | Type           | Description                                                                                                                                                                                          |
| ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**              | `Title`        | This column will hold the title of each entry (e.g., name of the organization or educational institution).                                                                                           |
| **Website**            | `URL`          | This column will store the URL of the organization's website.                                                                                                                                        |
| **Address**            | `Rich Text`    | This column will store the full address, including street, city, and postal code.                                                                                                                    |
| **Carrier**            | `Rich Text`    | This column will store the name of the organization or carrier responsible for the institution.                                                                                                      |
| **Region**             | `Select`       | This column will store the geographic region (e.g., a state or province). If a new region is found, it will be added automatically without overwriting existing values.                              |
| **Specializations**    | `Multi-select` | This column will store various specializations related to the organization (e.g., types of disabilities they specialize in). New specializations will be added automatically if not already present. |
| **Contacts**           | `Rich Text`    | This column will store contact details, including names, phone numbers, and email addresses.                                                                                                         |

## Instructions

1. Create a new database in Notion.
2. Add the columns as outlined in the table above with the respective property types.
3. Ensure that the `Region` column is set to `Select`, and the `Specializations` column is set to `Multi-select` so that new values can be added dynamically without overwriting existing ones.
4. Use the provided script to scrape data and populate the database.

---

## Notes

- The `Region` and `Specializations` properties will automatically expand if new values are encountered during data scraping.
- Ensure that the data structure aligns with the schema defined above to prevent errors when inserting data into the Notion database.
