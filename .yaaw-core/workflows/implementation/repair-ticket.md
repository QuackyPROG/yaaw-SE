# Repair ticket

Precondition: latest review result is `REPAIR` / ticket is `REPAIR_REQUIRED`.

Load the same ticket contract plus the specific review findings. Repair only what is required to satisfy the unchanged plan, rerun relevant verification, append evidence, and return the ticket to `REVIEW_REQUIRED`.

If repair requires changing product or architecture contracts, stop and route to `REPLAN`.
