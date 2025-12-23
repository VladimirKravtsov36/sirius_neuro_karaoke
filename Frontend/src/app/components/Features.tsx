import { Music, Users, Sparkles, Headphones, Clock, Award } from 'lucide-react';

const features = [
  {
    icon: Music,
    title: 'Massive Song Library',
    description: '50,000+ songs across all genres and languages. From classics to the latest hits.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Headphones,
    title: 'Pro Audio Equipment',
    description: 'Studio-quality microphones, speakers, and sound systems for crystal-clear performance.',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Users,
    title: 'Group Packages',
    description: 'Perfect for parties, corporate events, or just hanging with friends.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'LED & Light Show',
    description: 'Create the perfect atmosphere with customizable stage lighting and effects.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Clock,
    title: '24/7 Booking',
    description: 'Book anytime, anywhere. Flexible scheduling to match your plans.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Award,
    title: 'Expert Support',
    description: 'Our team ensures everything runs smoothly from setup to teardown.',
    gradient: 'from-red-500 to-pink-500',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Why Choose Us</span>
          </div>
          <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4">
            Everything You Need for the Perfect Karaoke Experience
          </h2>
          <p className="text-xl text-gray-600">
            Professional equipment, unlimited entertainment, unforgettable memories
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
