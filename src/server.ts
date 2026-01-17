import app from './app';
import { ENV } from './config/env';
import { TaskService } from './modules/tasks/tasks.service';

const PORT = ENV.PORT;

app.listen(PORT, async () => {
    console.log(`\n🚀 ZigletBackend running on port ${PORT}`);
    console.log(`📅 Current Garden Day (UTC): ${new Date().toISOString().split('T')[0]}`);
    console.log(`🔧 Environment: ${ENV.NODE_ENV}`);

    try {
        await TaskService.seedDefaults();
        console.log('✅ Tasks Seeded');
    } catch (err) {
        console.error('❌ Failed to seed tasks:', err);
    }

    console.log('\n');
});
