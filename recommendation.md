# Dynamic Recommendation Question Builder – Admin Dashboard Module

The **Recommendation Question Builder** is a fully dynamic decision-flow management system that allows administrators to create, edit, organize, and manage recommendation questions visually from the admin dashboard.

The system supports:

* Unlimited questions
* Unlimited options per question
* Vertical and horizontal question flow
* Conditional branching logic
* Multiple input types
* Dynamic navigation between questions
* Real-time recommendation path creation

This creates a powerful interactive recommendation engine where the next question changes based on the user's selected answer.

---

# Core Objective

The admin should be able to:

* Add questions dynamically
* Edit existing questions
* Remove questions
* Connect questions conditionally
* Create branching flows
* Control recommendation journeys visually
* Support multiple answer/input types

---

# Recommendation Questions Tab Structure

## 1. Greeting Section

At the top of the Recommendation Builder:

### System Greeting

This is the first message shown to users before the recommendation process begins.

### Features

* Add/Edit greeting message
* Enable rich text
* Add emojis/icons if required
* Multiple greeting templates

### Example

> “Welcome! Let’s help you find the best insurance plan tailored for your needs.”

---

# 2. Question Builder Canvas

Each question appears as a connected block/card.

Every question card contains:

* Question Title
* Question Type
* Answer Options
* Add Next Question Button
* Edit Button
* Delete Button
* Conditional Mapping

---

# 3. Supported Question Types

The system should support multiple input formats.

| Type             | Description             |
| ---------------- | ----------------------- |
| Radio Button     | Select one option       |
| Checkbox         | Select multiple options |
| Yes / No         | Binary choice           |
| Dropdown         | Select from list        |
| Text Input       | User types response     |
| Number Input     | Numeric value           |
| Date Picker      | Select date             |
| Slider           | Range selection         |
| File Upload      | Upload documents        |
| Multi-step Cards | Card-based options      |

---

# 4. Vertical & Horizontal Question Flow

The builder should support:

## Vertical Flow

Linear sequence of questions.

Example:

Question 1
↓
Question 2
↓
Question 3

---

## Horizontal Flow

Branching based on selected options.

Example:

Question 1
├── Option A → Question 2A
├── Option B → Question 2B
└── Option C → Question 2C

This enables dynamic recommendation paths.

---

# 5. Dynamic Question Linking Logic

Every question and every option can create a new branch.

## Question-Level Add Button

Inside every question card:

➕ Add Next Question

This creates the next question in sequence.

---

## Option-Level Add Button

Every option also contains:

➕ Add Conditional Question

This creates a question ONLY if that option is selected.

---

# 6. Unlimited Nested Flow Support

The system should allow:

* Infinite question depth
* Multiple branching levels
* Nested recommendation logic
* Multi-condition workflows

Example:

Question 1
→ Option A
→ Question 2
→ Option B
→ Question 3
→ Option C
→ Question 4

No limitation on hierarchy.

---

# 7. Admin Features

## Question Management

Admins can:

* Add questions
* Edit questions
* Delete questions
* Duplicate questions
* Reorder questions
* Drag-and-drop question cards

---

## Option Management

Admins can:

* Add options
* Edit option labels
* Delete options
* Change option order
* Add conditional paths

---

## Branching Controls

Admins can define:

* Which question appears next
* Which option triggers which question
* Skip logic
* Conditional visibility

---

# 8. Visual Flow Builder

The UI should visually display:

* Question hierarchy
* Parent-child connections
* Branching lines
* Horizontal & vertical structure

This helps admins understand the recommendation flow clearly.

---

# 9. Recommendation Engine Logic

The frontend recommendation system should dynamically render questions based on:

* Previous answers
* Conditional mappings
* Selected options
* User input values

The engine should automatically determine:

* Next question
* Recommendation path
* Final result

---

# 10. Database Structure Recommendation
 use proper organized data storage avoiding duplicates and organized way.

---

# 11. UI/UX Recommendations

## Recommended Features

* Drag-and-drop builder
* Zoom in/out flow canvas
* Auto-save
* Undo/Redo
* Flow preview mode
* Mobile responsive admin panel
* Search questions
* Duplicate flows/templates

---

# 12. Validation Rules

The system should validate:

* Empty questions
* Missing option labels
* Broken conditional links
* Circular loops
* Duplicate paths
* Invalid branching

---

# 13. Final Recommendation Output

After the question flow completes:

The system should:

* Analyze selected answers
* Match recommendation rules
* Generate personalized recommendations
* Display final result dynamically

---

# Example Flow

## Greeting

> “Welcome! Let’s find the best insurance plan for you.”

---

## Question 1

### What type of insurance are you looking for?

Options:

* Health Insurance ➕
* Vehicle Insurance ➕
* Life Insurance ➕

---

## If User Clicks “Health Insurance”

### Question 2A

Do you already have an existing policy?

Options:

* Yes ➕
* No ➕

---

## If User Clicks “Yes”

### Question 3A

Please enter your current insurer name.

Input Type:

* Text Input

---

## If User Clicks “No”

### Question 3B

What coverage amount are you looking for?

Options:

* ₹5 Lakhs
* ₹10 Lakhs
* ₹25 Lakhs

---

## If User Clicks “Vehicle Insurance”

### Question 2B

Which vehicle do you own?

Options:

* Bike
* Car
* Commercial Vehicle

---

# Final Result Example

Based on the selected flow, the system generates:

* Recommended insurance plans
* Premium estimation
* Suggested coverage
* Partner referral assignment
* Lead creation for employees/admin