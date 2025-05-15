# scripts/create_finetunes.py
# Updated for openai-python >=1.0.0 API, using a fine-tunable gpt-4.1 base model
import os
from openai import OpenAI

# Initialize client with your API key
def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Please set the OPENAI_API_KEY environment variable.")
    return OpenAI(api_key=api_key)


def upload_and_tune(path: str, model: str = "gpt-4.1-2025-04-14", suffix: str = None) -> str:
    """
    Uploads a JSONL file for fine-tuning and creates a fine-tune job.
    Returns the fine-tune job ID.

    Note: Using gpt-4.1-2025-04-14 as the base model for fine-tuning.
    """
    client = get_client()
    print(f"\n→ Processing {path} …")

    # 1) Upload the training file
    file_resp = client.files.create(
        file=open(path, "rb"),
        purpose="fine-tune"
    )
    file_id = file_resp.id
    print("  uploaded file:", file_id)

    # 2) Create fine-tune job using the correct v1 API namespace
    ft_resp = client.fine_tuning.jobs.create(
        training_file=file_id,
        model=model,
        suffix=suffix or None
    )
    job_id = ft_resp.id
    print("  fine-tune job id:", job_id)
    return job_id


if __name__ == "__main__":
    jobs = {}

    # Therapist adapter (gpt-4.1 base)
    jobs["empathy_v5.clean"] = upload_and_tune(
        "data/ft_source/empathy_ft_v5.clean.jsonl",
        model="gpt-4.1-2025-04-14",
        suffix="empathy_v5"
    )


    print("\nAll jobs kicked off:")
    for name, jid in jobs.items():
        print(f"  {name}: {jid}")

    print("\nMonitor your jobs with:")
    print("  python -m openai api fine_tunes.list")
    print("  python -m openai api fine_tunes.get -i <JOB_ID>")
