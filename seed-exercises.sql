-- Seed standard exercises for the Exercise Tracker
-- This adds default exercises that all coaches can use

-- First, get an admin user ID (adjust if your admin has a different ID)
-- Assuming the first user or a user with ID 1 is an admin

-- Standard Strength Exercises
INSERT INTO exercises (name, description, category, muscleGroups, equipment, isStandard, createdBy, createdAt, updatedAt) VALUES
('Push-ups', 'Upper body strength exercise using body weight', 'strength', '["chest", "triceps", "shoulders"]', 'bodyweight', true, 1, NOW(), NOW()),
('Squats', 'Lower body strength exercise', 'strength', '["quadriceps", "hamstrings", "glutes"]', 'bodyweight', true, 1, NOW(), NOW()),
('Deadlifts', 'Full body strength exercise', 'strength', '["back", "glutes", "hamstrings", "core"]', 'barbell', true, 1, NOW(), NOW()),
('Bench Press', 'Upper body pressing movement', 'strength', '["chest", "triceps", "shoulders"]', 'barbell', true, 1, NOW(), NOW()),
('Squats (Barbell)', 'Lower body strength with barbell', 'strength', '["quadriceps", "hamstrings", "glutes"]', 'barbell', true, 1, NOW(), NOW()),
('Pull-ups', 'Upper body pulling exercise', 'strength', '["back", "biceps", "shoulders"]', 'bar', true, 1, NOW(), NOW()),
('Dumbbell Curls', 'Arm strength exercise', 'strength', '["biceps"]', 'dumbbell', true, 1, NOW(), NOW()),
('Dumbbell Rows', 'Back and arm strength', 'strength', '["back", "biceps"]', 'dumbbell', true, 1, NOW(), NOW()),
('Planks', 'Core stability exercise', 'strength', '["core", "shoulders"]', 'bodyweight', true, 1, NOW(), NOW()),
('Lunges', 'Single leg strength exercise', 'strength', '["quadriceps", "glutes", "hamstrings"]', 'bodyweight', true, 1, NOW(), NOW()),

-- Standard Cardio Exercises
('Running', 'Aerobic cardiovascular exercise', 'cardio', '["legs", "cardiovascular"]', 'none', true, 1, NOW(), NOW()),
('Cycling', 'Lower body cardio exercise', 'cardio', '["legs", "cardiovascular"]', 'bicycle', true, 1, NOW(), NOW()),
('Swimming', 'Full body cardio exercise', 'cardio', '["full body", "cardiovascular"]', 'pool', true, 1, NOW(), NOW()),
('Jumping Jacks', 'Full body cardio movement', 'cardio', '["full body", "cardiovascular"]', 'bodyweight', true, 1, NOW(), NOW()),
('Sprints', 'High intensity running', 'cardio', '["legs", "cardiovascular"]', 'none', true, 1, NOW(), NOW()),
('Burpees', 'Full body cardio and strength', 'cardio', '["full body"]', 'bodyweight', true, 1, NOW(), NOW()),

-- Standard Flexibility Exercises
('Hamstring Stretch', 'Stretching hamstring muscles', 'flexibility', '["hamstrings"]', 'none', true, 1, NOW(), NOW()),
('Quad Stretch', 'Stretching quadriceps muscles', 'flexibility', '["quadriceps"]', 'none', true, 1, NOW(), NOW()),
('Shoulder Stretch', 'Stretching shoulder muscles', 'flexibility', '["shoulders"]', 'none', true, 1, NOW(), NOW()),
('Cat-Cow Stretch', 'Full body flexibility movement', 'flexibility', '["back", "core", "shoulders"]', 'mat', true, 1, NOW(), NOW()),
('Downward Dog', 'Yoga flexibility pose', 'flexibility', '["full body", "shoulders", "hamstrings"]', 'mat', true, 1, NOW(), NOW()),

-- Standard Balance Exercises
('Single Leg Stand', 'Balance exercise on one leg', 'balance', '["legs", "core"]', 'bodyweight', true, 1, NOW(), NOW()),
('Bosu Ball Balance', 'Balance exercise using stability ball', 'balance', '["core", "legs", "proprioception"]', 'bosu ball', true, 1, NOW(), NOW()),
('Yoga Tree Pose', 'Standing balance yoga pose', 'balance', '["legs", "core"]', 'mat', true, 1, NOW(), NOW()),

-- Standard Sport-Specific Exercises
('Agility Ladder Drills', 'Sport-specific footwork training', 'sport-specific', '["legs", "agility"]', 'agility ladder', true, 1, NOW(), NOW()),
('Cone Drills', 'Direction change and agility training', 'sport-specific', '["legs", "agility", "cardiovascular"]', 'cones', true, 1, NOW(), NOW()),
('Ball Control Drills', 'Sport-specific ball handling', 'sport-specific', '["coordination", "hands"]', 'ball', true, 1, NOW(), NOW()),
('Plyometric Box Jumps', 'Explosive power exercise', 'sport-specific', '["legs", "power"]', 'plyo box', true, 1, NOW(), NOW());
