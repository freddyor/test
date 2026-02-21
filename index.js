import React, { useState } from 'react';
import Marker from './Marker';

const LocationsMap = ({ markers }) => {
  const [filteredMarkers, setFilteredMarkers] = useState(markers);
  const [selectedTopic, setSelectedTopic] = useState('');

  const filterByTopic = (topic) => {
    if (topic) {
      const newFilteredMarkers = markers.filter(marker => marker.topic === topic);
      setFilteredMarkers(newFilteredMarkers);
    } else {
      setFilteredMarkers(markers);
    }

    setSelectedTopic(topic);
  };

  return (
    <div className="locations-map">
      <button onClick={() => filterByTopic('')}>Explore Locations</button>
      <button onClick={() => setDropdownVisible(!dropdownVisible)}>Topics</button>
      {dropdownVisible && (
        <div className="dropdown">
          <button onClick={() => filterByTopic('roman')}>Roman</button>
          <button onClick={() => filterByTopic('lgbt')}>LGBT</button>
          <button onClick={() => filterByTopic('norman')}>Norman</button>
        </div>
      )}
      {filteredMarkers.map(marker => (
        <Marker key={marker.id} {...marker} />
      ))}
    </div>
  );
};

export default LocationsMap;