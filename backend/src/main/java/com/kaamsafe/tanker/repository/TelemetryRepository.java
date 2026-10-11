package com.kaamsafe.tanker.repository;
import com.kaamsafe.tanker.model.TelemetryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TelemetryRepository extends JpaRepository<TelemetryEvent, String> {
    Optional<TelemetryEvent> findTopByTankerIdOrderByRecordedAtDesc(String tankerId);
    List<TelemetryEvent> findTop100ByTankerIdOrderByRecordedAtDesc(String tankerId);
    long countByTankerId(String tankerId);
}
