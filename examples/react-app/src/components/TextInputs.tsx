import Card from './Card';
import Prompts from './Prompts';

export default function TextInputs() {
  return (
    <Card icon="📝" title="Text Inputs">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full Name</label>
          <input type="text" id="name" className="input" placeholder="John Doe" />
        </div>

        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input type="email" id="email" className="input" placeholder="john@example.com" />
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone Number</label>
          <input type="tel" id="phone" className="input" placeholder="+1 (555) 123-4567" />
        </div>

        <div>
          <label htmlFor="age" className="label">Age</label>
          <input type="number" id="age" className="input" defaultValue="25" min="0" max="120" />
        </div>

        <div>
          <label htmlFor="website" className="label">Website</label>
          <input type="url" id="website" className="input" placeholder="https://example.com" />
        </div>
      </div>

      <Prompts prompts={[
        'Fill the name field with "Sarah Johnson"',
        'Set email to "sarah@example.com"',
        'Change age to 30',
        'Fill all the text fields with sample data',
        'Clear the phone number field',
        "What's the current value of the email field?"
      ]} />
    </Card>
  );
}

