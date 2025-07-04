# vue-fastapi-template

A starting point for a vue frontend + fastapi backend repo. It uses ts, vite, and uvicorn.

## install
1. Replace all occurrences of `project-name` in all files with the actual name of the project.
2. Run the following commands to install the dependencies.

```bash
pip install -e back
cd front
npm install
```

## run

```bash
uvicorn back.app.main:app --reload
```

```bash
cd front
npm run dev
```
