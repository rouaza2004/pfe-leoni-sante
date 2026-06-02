# Backend structure

This backend is organized as Django apps. Each app keeps framework files at the
root and moves reusable business logic into subpackages.

## App layout

Use this shape for new backend code:

```text
app_name/
  admin.py
  apps.py
  models.py
  permissions.py
  serializers.py
  urls.py
  views.py
  services/
    __init__.py
    feature_service.py
  migrations/
    __init__.py
```

## What belongs where

- `models.py`: database tables and model-level behavior.
- `serializers.py`: API input/output validation and formatting.
- `views.py`: HTTP request handling only.
- `urls.py`: route definitions.
- `permissions.py`: API access rules.
- `services/`: email, PDF generation, AI calls, SMS calls, calculations, and
  other reusable business logic.
- `migrations/`: Django migration history. Do not edit old migrations unless
  you are intentionally repairing a local development database.

## About `__init__.py`

`__init__.py` files mark folders as Python packages. They are often empty, and
that is normal. Keep them in app folders, `services/`, `management/commands/`,
and `migrations/`.

## Refactor rule

Prefer moving service logic first. Split large `views.py`, `serializers.py`, or
`models.py` files only feature by feature, with tests or `manage.py check` after
each step.

