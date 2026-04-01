import os
import sys
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

def generate_clip(prompt, output_path, duration=12):
    print(f"Generating clip: {output_path}")
    print(f"Prompt: {prompt[:80]}...")
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    video_bytes = video_gen.text_to_video(
        prompt=prompt,
        model="sora-2",
        size="1280x720",
        duration=duration,
        max_wait_time=600
    )
    if video_bytes:
        video_gen.save_video(video_bytes, output_path)
        print(f"Saved: {output_path}")
        return True
    print(f"FAILED: {output_path}")
    return False

# Clip 1: Customer side - creating request, chat, confirmation
prompt1 = """Cinematic promotional video for a home services platform. 
Scene 1: A young European man sitting at a modern desk, typing on a laptop, filling out a service request form on a bright orange and white website. 
Scene 2: Close-up of a phone screen showing a chat conversation between customer and craftsman. 
Scene 3: The customer smiles and confirms the order with a click. 
Smooth transitions, warm lighting, professional corporate style, 4K quality."""

# Clip 2: Craftsman side - arriving, working, handover
prompt2 = """Cinematic promotional video continuation. 
Scene 1: A white European craftsman in work clothes arrives at a modern house in a white van, carrying tools. 
Scene 2: The craftsman is working inside the house - installing electrical outlets on a white wall, professional and focused. 
Scene 3: The craftsman and the homeowner shake hands in the finished room, both smiling. The customer hands over cash payment.
Smooth transitions, warm lighting, professional corporate style, 4K quality."""

os.makedirs('/app/backend/uploads', exist_ok=True)

print("=== Starting video generation ===")
r1 = generate_clip(prompt1, '/app/backend/uploads/promo_clip1.mp4', duration=12)
print(f"Clip 1 result: {r1}")

r2 = generate_clip(prompt2, '/app/backend/uploads/promo_clip2.mp4', duration=12)
print(f"Clip 2 result: {r2}")

print("=== All done ===")
