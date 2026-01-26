import os
import time
from functools import wraps
from fishaudio import FishAudio
from fishaudio.types import ReferenceAudio
from fishaudio.utils import save, play

from dotenv import load_dotenv
load_dotenv()

def timer_decorator(func):
    """
    Wrapper to calculate the execution time of a function.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        print(f"\n[Timer] Starting {func.__name__}...")
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_time = time.time()
            execution_time = end_time - start_time
            print(f"[Timer] {func.__name__} finished in {execution_time:.4f} seconds.\n")
    return wrapper

@timer_decorator
def get_text(file):
    with open(file, "r", encoding="utf-8") as f:
        return f.read()

@timer_decorator
def transcribe_audio(client, audio_path, language="zh"):
    with open(audio_path, "rb") as f:
        audio_content = f.read()
    asr_result = client.asr.transcribe(audio=audio_content, language=language)
    return asr_result.text

@timer_decorator
def instance_clone_test(model, api_key, input_audio_path, text_to_speak, output_audio_path="fish_audio_quick_clone.mp3"):
    # Initialize client
    client = FishAudio(api_key=api_key)
    start_credits = None
    # Get initial credits
    try:
        start_credits_response = client.account.get_credits()
        start_credits = start_credits_response.credit
        print(f"Initial credits: {start_credits}")
    except Exception as e:
        print(f"Failed to get initial credits: {e}")
        start_credits = None

    # Input and output paths
    # Using the existing file in the workspace 
    #input_audio_path = os.path.join("data", "季冠霖语音包.MP3") 
    #output_audio_path = "fish_audio_output.mp3"
    
    # Text to be generated
    with open(os.path.join("data", "input2.txt"), "r", encoding="utf-8") as f:
        text_to_speak = f.read()
        print(f"Input text length: {len(text_to_speak.encode('utf-8'))} utf-8 bytes")

    if not os.path.exists(input_audio_path):
        print(f"Error: Input file '{input_audio_path}' not found.")
        return

    print(f"Reading reference audio from: {input_audio_path}")
    
    try:
        with open(input_audio_path, "rb") as f:
            reference_audio_content = f.read()
            
        # Step 1: Transcribe the reference audio to get the text
        # This helps the model understand what part of the audio is content vs style
        print("Transcribing reference audio...")
        asr_result = client.asr.transcribe(audio=reference_audio_content, language="zh")
        reference_text = asr_result.text
        print(f"Reference text: {reference_text}")

        print("Generating audio...")
        
        # Step 2: Clone voice and generate new speech
        audio = client.tts.convert(
            model="speech-1.6",
            text=text_to_speak,
            speed=1,
            references=[ReferenceAudio(
                audio=reference_audio_content,
                text=reference_text
            )]
        )
        
        print(f"Saving generated audio to: {output_audio_path}")
        save(audio, output_audio_path)
        print("Done!")

        # Get final credits and calculate usage
        if start_credits is not None:
            try:
                end_credits_response = client.account.get_credits()
                end_credits = end_credits_response.credit
                print(f"Final credits: {end_credits}")
                print(f"API usage consumed: {start_credits - end_credits}")
            except Exception as e:
                print(f"Failed to get final credits: {e}")

    except Exception as e:
        print(f"An error occurred: {e}")

@timer_decorator
def voice_create_and_generate_test(model,
                                   api_key, 
                                   input_audio_path, 
                                   text_to_speak, 
                                   output_audio_path="fish_audio_voice_create.mp3", 
                                   with_transcript=False):
    client = FishAudio(api_key=api_key)
    
    start_credits = None
    # Get initial credits
    try:
        start_credits_response = client.account.get_credits()
        start_credits = start_credits_response.credit
        print(f"Initial credits: {start_credits}")
    except Exception as e:
        print(f"Failed to get initial credits: {e}")
        start_credits = None
    
    if not os.path.exists(input_audio_path):
        print(f"Error: Input file '{input_audio_path}' not found.")
        return

    print(f"Reading voice sample from: {input_audio_path}")
    try:
        with open(input_audio_path, "rb") as f:
            voice_audio = f.read()

        voices = [voice_audio]
        texts = []

        if with_transcript:
            print("Transcribing voice sample for better accuracy...")
            # Transcribe to get text if we want to provide it 'with transcript'
            # Note: If you already have the transcript, you should skip this and simply append it to texts
            asr_result = client.asr.transcribe(audio=voice_audio, language="zh")
            reference_text = asr_result.text
            texts.append(reference_text)
            print(f"Transcript generated: {reference_text}")
            
        print("Creating persistent voice model...")
        print(f"Config:\n\t input audios: {len(voices)}\n\t with transcript: {with_transcript}\n\t model: {model}")
        create_kwargs = {
            "title": "Test Persistent Voice",
            "voices": voices,
            "description": "Created by automated test script",
            "tags": ["test", "automated"],
            # Enable automatic audio enhancement to clean up noisy reference audio
            #"enhance_audio_quality": True 
        }
        
        if with_transcript and texts:
             create_kwargs["texts"] = texts

        voice = client.voices.create(**create_kwargs)
        print(f"Voice model created successfully. ID: {voice.id}")
        
        print("\nGenerating audio with the new voice model...")
        print(f'Text: {text_to_speak}')
        audio = client.tts.convert(
            text=text_to_speak,
            reference_id=voice.id,
            speed=1,
            model=model
        )
        
        print(f"Saving generated audio to: {output_audio_path}")
        save(audio, output_audio_path)
        print("Done!")

         # Get final credits and calculate usage
        if start_credits is not None:
            try:
                end_credits_response = client.account.get_credits()
                end_credits = end_credits_response.credit
                print(f"Final credits: {end_credits}")
                print(f"API usage consumed: {start_credits - end_credits}")
            except Exception as e:
                print(f"Failed to get final credits: {e}")
    except Exception as e:
        print(f"An error occurred during voice creation or generation: {e}")
    return voice.id

@timer_decorator
def generate_with_voice_id(api_key, voice_id, text_to_speak, output_audio_path="fish_audio_from_id.mp3"):
    """
    Generate audio using a specific voice ID.
    
    Args:
        api_key (str): Fish Audio API Key.
        voice_id (str): The ID of the voice model to use.
        text_to_speak (str): The text content to generate speech for.
        output_audio_path (str): Path to save the generated audio file.
    """
    client = FishAudio(api_key=api_key)
    
    print(f"Generating audio using voice ID: {voice_id}")
    try:
        # Generate audio using the specified voice ID
        audio = client.tts.convert(
            text=text_to_speak,
            reference_id=voice_id,
            speed=0.8,
            model="speech-1.6" 
        )
        
        print(f"Saving generated audio to: {output_audio_path}")
        save(audio, output_audio_path)
        print("Done!")
    except Exception as e:
        print(f"An error occurred during generation: {e}")

@timer_decorator
def emotion_control_test(api_key, input_audio_path, text_to_speak, output_audio_path="fish_audio_emotion_control.mp3"):
    pass

@timer_decorator
def main():
    model = "s1"
    INPUTDIR = "/home/xiaowu/voice_web_app/data/audio"
    OUTPUTDIR = "/home/xiaowu/voice_web_app/test_scripts"
    # Check for API key
    api_key = os.getenv("FISH_API_KEY")
    if not api_key:
        print("Error: FISH_API_KEY environment variable not set.")
        print("Please set it using: export FISH_API_KEY=your_api_key_here")
        # For testing purposes, if you have a key, you can uncomment the line below and add it
        # api_key = "YOUR_API_KEY"
        return
    
    # Load text to speak
    text_path = os.path.join("/home/xiaowu/voice_web_app/data", "input2.txt")
    if os.path.exists(text_path):
        with open(text_path, "r") as f:
            text_to_speak = f.read()
    else:
        text_to_speak = "你好，我是智能语音助手。"
        print(f"Warning: {text_path} not found, using default text.")
    # Uncomment the function you want to test:
    
    # Test 1: Quick Clone (Instant)
    # instance_clone_test(api_key, os.path.join("data", "季冠霖语音包.MP3"), text_to_speak)
    
    # Test 2: Create Persistent Voice Model
    
    
    print("Running voice_create_and_generate_test...")
    
    input_audio = "季冠霖语音包.MP3"
    base_name = os.path.splitext(input_audio)[0]
    input_audio_path = os.path.join(INPUTDIR, input_audio)
    
    output_audio_path = os.path.join(OUTPUTDIR, f"{base_name}_output.mp3")
    voice_id1 = voice_create_and_generate_test(model, api_key, 
                                   input_audio_path, 
                                   text_to_speak, 
                                   output_audio_path=output_audio_path, 
                                   with_transcript=False)
    print(f"Generated audio with voice ID: {voice_id1} without transcript.\nFile saved to {output_audio_path}")
    
    #output_audio_path = os.path.join(OUTPUTDIR, f"{base_name}_4.mp3")
    #voice_id2 = voice_create_and_generate_test(api_key, 
    #                               input_audio_path, 
    #                               text_to_speak,
    #                               output_audio_path=output_audio_path, 
    #                               with_transcript=True)
    #print(f"Generated audio with voice ID: {voice_id2} with transcript. File saved to {output_audio_path}")
    
    

if __name__ == "__main__":
    main()
