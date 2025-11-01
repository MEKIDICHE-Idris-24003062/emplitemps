<?php
namespace App;
use App\Database; use PDO; use Exception; use DateTime; use DateInterval;


class Events {
    public static function list(DateTime $start, int $days, ?int $userId): array {
        $pdo = Database::pdo();
        $end = (clone $start)->add(new DateInterval('P'.max(1,$days).'D'));
// Pour l'instant: on retourne seulement les événements de l'utilisateur connecté
// (plus tard on pourra merger avec un flux ICS de la promo comme 2GA1-2)
        $sql = 'SELECT * FROM events WHERE start < :end AND end > :start';
        $params = [':start'=>$start->format(DateTime::ATOM), ':end'=>$end->format(DateTime::ATOM)];
        if($userId){ $sql .= ' AND user_id = :uid'; $params[':uid']=$userId; } else { $sql .= ' AND 1=0'; }
        $sql .= ' ORDER BY start';
        $stmt = $pdo->prepare($sql); $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public static function create(int $userId, array $d): int {
        self::validate($d);
        $pdo = Database::pdo();
        $stmt = $pdo->prepare('INSERT INTO events(user_id,title,start,end,location,color,notes) VALUES(?,?,?,?,?,?,?)');
        $stmt->execute([$userId, trim($d['title']), $d['start'], $d['end'], $d['location']??null, $d['color']??null, $d['notes']??null]);
        return (int)$pdo->lastInsertId();
    }
    public static function update(int $userId, int $id, array $d): void {
        $pdo = Database::pdo();
// verify ownership
        $own = $pdo->prepare('SELECT user_id FROM events WHERE id=?'); $own->execute([$id]);
        $row = $own->fetch(PDO::FETCH_ASSOC); if(!$row || (int)$row['user_id'] !== $userId) throw new Exception('Non autorisé');
        $fields = ['title','start','end','location','color','notes'];
        $set=[]; $vals=[];
        foreach($fields as $f){ if(isset($d[$f])){ $set[]="$f=?"; $vals[]=$d[$f]; } }
        if(!$set) return; $vals[]=$id;
        $sql = 'UPDATE events SET '.implode(',', $set).', updated_at = datetime("now") WHERE id=?';
        $stmt = $pdo->prepare($sql); $stmt->execute($vals);
    }
    public static function delete(int $userId, int $id): void {
        $pdo = Database::pdo();
        $own = $pdo->prepare('DELETE FROM events WHERE id=? AND user_id=?'); $own->execute([$id,$userId]);
    }
    private static function validate(array $d): void {
        foreach(['title','start','end'] as $k){ if(empty($d[$k])) throw new Exception("Champ requis: $k"); }
        if(strtotime($d['end']) <= strtotime($d['start'])) throw new Exception('Fin doit être après le début');
    }
}