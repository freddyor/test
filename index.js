// Assuming we are using a framework like React for this example

import React, { useState } from 'react';

const Index = () => {
    const [markers, setMarkers] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const topics = [...new Set(markers.map(marker => marker.topic))]; // Unique topics from markers

    const handleTopicChange = (event) => {
        setSelectedTopic(event.target.value);
    };

    const filteredMarkers = selectedTopic ? markers.filter(marker => marker.topic === selectedTopic) : markers;

    return (
        <div>
            <h1>Marker Map</h1>
            <select onChange={handleTopicChange} value={selectedTopic}>
                <option value=''>All Topics</option>
                {topics.map((topic, index) => (
                    <option key={index} value={topic}>{topic}</option>
                ))}
            </select>
            <div>
                {filteredMarkers.map(marker => (
                    <div key={marker.id}>{marker.name}</div>
                ))}
            </div>
        </div>
    );
};

export default Index;