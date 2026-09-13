# AlgoTrace

AlgoTrace is an interactive Java code execution and algorithm visualization tool designed to help students understand how code executes step by step.

Instead of only seeing the final output, AlgoTrace shows the internal execution state of a program, including method calls, variables, data structures, and recursion.

## Features

- Execute Java code dynamically
- Step-by-step execution
- Source code line highlighting
- Execution state tracking
- Variable value tracking
- Method call tracking
- Recursion tree visualization
- Array visualization
- Stack visualization
- Queue visualization
- Linked List visualization
- Previous / Next execution states
- Automatic visualization based on the detected data structure

## Visualizations

### Recursion

Recursive method calls are displayed as a recursion tree.

Example:

```text
factorial(5)
    |
    └── factorial(4)
          |
          └── factorial(3)
                |
                └── factorial(2)
                      |
                      └── factorial(1)
```

### Array

Array values are captured during execution and displayed visually.

Example:

```text
[64, 25, 12, 22, 11]

After sorting:

[11, 12, 22, 25, 64]
```

### Stack

Java `Stack` operations such as `push`, `pop`, and `peek` are visualized.

Example:

```text
TOP
┌────┐
│ 30 │
├────┤
│ 20 │
├────┤
│ 10 │
└────┘
BASE
```

### Queue

Java `Queue` operations are represented in FIFO order.

Example:

```text
FRONT → [10] [20] [30] ← REAR
```

### Linked List

Linked list nodes and their connections are visualized during execution.

Example:

```text
[10] → [20] → [30] → [40] → null
```

## How It Works

AlgoTrace consists of two main parts:

```text
User Java Code
      ↓
Java Execution Engine
      ↓
Runtime Execution Events
      ↓
Variable & Data Structure Extraction
      ↓
Execution States
      ↓
React Frontend
      ↓
Interactive Visualization
```

The execution engine uses Java Debug Interface (JDI) to observe the running Java program.

The captured execution events are then processed by the frontend to display the appropriate visualization.

## Execution Events

The execution engine captures events such as:

```text
METHOD_ENTER
LINE_EXECUTED
METHOD_EXIT
```

These events are used to build execution states and visualizations.

## Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript
- React Router

### Backend / Execution Engine

- Java
- Maven
- Java Debug Interface (JDI)
- JavaParser

## Project Structure

```text
algorithm-visualizer/
.
├── backend
│   ├── HELP.md
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   ├── src
│   ├── target
│   └── workspace
├── docs
├── execution-engine
│   ├── pom.xml
│   ├── src
│   ├── target
│   └── workspace
└── frontend
    ├── dist
    ├── eslint.config.js
    ├── index.html
    ├── node_modules
    ├── package.json
    ├── package-lock.json
    ├── public
    ├── README.md
    ├── src
    └── vite.config.js
```

## Running the Project

### 1. Clone the repository

```bash
git clone <repository-url>
cd algorithm-visualizer
```

### 2. Run the Execution Engine

Navigate to the execution engine:

```bash
cd execution-engine
```

Build the project:

```bash
mvn clean install
```

### 3. Run the Frontend

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown by Vite in your browser.

## Example

You can enter Java code such as:

```java
public class Test {

    public static void main(String[] args) {

        int[] arr = {64, 25, 12, 22, 11};

        selectionSort(arr);

        System.out.println(arr[0]);
    }

    static void selectionSort(int[] arr) {

        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {

            int minIndex = i;

            for (int j = i + 1; j < n; j++) {

                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }

            int temp = arr[minIndex];
            arr[minIndex] = arr[i];
            arr[i] = temp;
        }
    }
}
```

After execution, AlgoTrace allows you to move through the execution states and observe how the array changes line by line.

## Goal

The goal of AlgoTrace is to make algorithm execution easier to understand by providing a visual representation of what happens inside a program during runtime.

It is especially useful for learning:

- Data Structures
- Algorithms
- Recursion
- Java Programming
- Debugging
- Program Execution

## Current Status

The first version focuses on the core execution and visualization functionality.

Supported visualizations currently include:

- Recursion
- Arrays
- Stack
- Queue
- Linked List

Additional advanced features are planned for future versions.

## Future Improvements

Possible features for V2 include:

- More data structure visualizations
- Better execution controls
- Improved recursion visualization
- More advanced debugging information
- User accounts and saved executions
- Online deployment and public access
- Additional language support

## License

This project is developed for educational and learning purposes.
