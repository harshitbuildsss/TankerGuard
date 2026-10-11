package com.kaamsafe.tanker.repository;
import com.kaamsafe.tanker.model.IncidentStatus;
import com.kaamsafe.tanker.model.WaterLossIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface IncidentRepository extends JpaRepository<WaterLossIncident, Long> {
    List<WaterLossIncident> findAllByOrderByDetectedAtDesc();
    List<WaterLossIncident> findByStatusOrderByDetectedAtDesc(IncidentStatus status);
    List<WaterLossIncident> findByTankerIdOrderByDetectedAtDesc(String tankerId);
    long countByStatusIn(List<IncidentStatus> statuses);
}
