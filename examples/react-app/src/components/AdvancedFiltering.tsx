import Card from './Card';
import Prompts from './Prompts';

export default function AdvancedFiltering() {
  return (
    <Card icon="🔍" title="Advanced Filtering & Scanning" tag="New">
      <div className="info-box">
        <strong className="text-primary block mb-2">🎯 Powerful Filtering Options</strong>
        UUICS supports regex patterns, element type filtering, and CSS selectors to control what gets scanned. Perfect for focusing on specific parts of your UI!
      </div>

      <div className="space-y-6">
        <div>
          <div className="section-title">Admin Controls</div>
          <p className="text-sm text-gray-600 mb-4">These fields have 'admin' in their classes/IDs - try filtering with includePatterns: /admin/i</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="label">Admin Username</label>
              <input type="text" id="admin-username" className="input admin-field" placeholder="admin" />
            </div>

            <div>
              <label htmlFor="admin-password" className="label">Admin Password</label>
              <input type="password" id="admin-password" className="input admin-field" placeholder="••••••••" />
            </div>

            <div>
              <label htmlFor="admin-role" className="label">Admin Role</label>
              <select id="admin-role" className="input admin-field">
                <option value="">Select role...</option>
                <option value="superadmin">Super Admin</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support Staff</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="section-title">User Controls</div>
          <p className="text-sm text-gray-600 mb-4">Regular user fields with 'user' class - filter separately from admin</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="user-email" className="label">User Email</label>
              <input type="email" id="user-email" className="input user-field" placeholder="user@example.com" />
            </div>

            <div>
              <label htmlFor="user-nickname" className="label">User Nickname</label>
              <input type="text" id="user-nickname" className="input user-field" placeholder="Cool User" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono space-y-2">
          <div><span className="text-gray-500">// Example: Include only admin fields</span></div>
          <div>{'{ scan: { includePatterns: /admin/i } }'}</div>
          <div className="mt-2"><span className="text-gray-500">// Example: Include only input elements</span></div>
          <div>{"{ scan: { includeElements: ['input', 'button'] } }"}</div>
          <div className="mt-2"><span className="text-gray-500">// Example: Exclude user fields</span></div>
          <div>{'{ scan: { excludePatterns: /user/i } }'}</div>
        </div>
      </div>

      <Prompts prompts={[
        'Fill in the admin username with "admin123"',
        'Set admin password to "secure123"',
        'List all admin fields',
        'What user controls are available?',
        'Fill the user email with "john@example.com"',
        'Select super admin as the admin role'
      ]} />
    </Card>
  );
}

